import json
import re
import copy
from formatter import apply_format

class MissingKeyError(Exception):
    pass

def load_json(filepath: str) -> dict:
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_by_dot_notation(data: dict, key: str):
    keys = key.split('.')
    val = data
    for k in keys:
        if isinstance(val, dict) and k in val:
            val = val[k]
        else:
            # Fallback to checking inside 'invoice' if not found at root
            if val is data and 'invoice' in data:
                try:
                    return get_by_dot_notation(data['invoice'], key)
                except MissingKeyError:
                    pass
            raise MissingKeyError(f"Key '{key}' not found (failed at '{k}')")
    
    if val is None:
        return ""
    return val

def resolve_template(data: dict, template: str) -> str:
    # find all {key} in template and replace
    matches = re.findall(r'\{([^}]+)\}', template)
    result = template
    for match in matches:
        try:
            val = get_by_dot_notation(data, match)
        except MissingKeyError:
            val = ""
        if val is None:
            val = ""
        result = result.replace(f"{{{match}}}", str(val))
    return result

def clean_none(value):
    if value is None:
        return ""
    if isinstance(value, dict):
        return {k: clean_none(v) for k, v in value.items()}
    if isinstance(value, list):
        return [clean_none(v) for v in value]
    return value

def process_field(data, field):
    # Support both "value_key" and "key"
    key_field = 'value_key' if 'value_key' in field else ('key' if 'key' in field else None)
    
    if key_field:
        try:
            val = get_by_dot_notation(data, field[key_field])
        except MissingKeyError:
            val = ""
        fmt = field.get('format')
        field['resolved_value'] = apply_format(val, fmt)
    elif 'value_template' in field:
        val = resolve_template(data, field['value_template'])
        field['resolved_value'] = val
    elif 'value' in field:
        field['resolved_value'] = str(field['value']) if field['value'] is not None else ""
        
    if 'append' in field:
        app = resolve_template(data, field['append'])
        field['resolved_value'] = str(field.get('resolved_value', '')) + " " + app
        
    if 'content_key' in field:
        try:
            val = get_by_dot_notation(data, field['content_key'])
        except MissingKeyError:
            val = ""
        field['resolved_value'] = str(val)

def process_table_col(data, col, row_data):
    key_field = 'value_key' if 'value_key' in col else ('key' if 'key' in col else None)
    
    val = ""
    if key_field:
        try:
            val = get_by_dot_notation(row_data, col[key_field])
        except MissingKeyError:
            try:
                val = get_by_dot_notation(data, col[key_field])
            except MissingKeyError:
                val = ""
            
        fmt = col.get('format')
        col['resolved_value'] = apply_format(val, fmt)
    elif 'value_template' in col:
        merged = copy.deepcopy(data)
        merged.update(row_data)
        col['resolved_value'] = resolve_template(merged, col['value_template'])
    elif 'value' in col:
        col['resolved_value'] = str(col['value']) if col['value'] is not None else ""
        
    if 'suffix' in col:
        suf = resolve_template(data, col['suffix'])
        col['resolved_value'] = str(col.get('resolved_value', '')) + suf

def parse_and_resolve(filepath: str) -> dict:
    data = load_json(filepath)
    data = clean_none(data)
    
    context = copy.deepcopy(data)
    sections = context.get('layout', {}).get('sections', [])
    
    for section in sections:
        if section.get('type') == 'two_column_split':
            for panel in ['left', 'right']:
                if panel in section:
                    for field in section[panel].get('fields', []):
                        process_field(data, field)
                    for row in section[panel].get('rows', []):
                        process_field(data, row)
                        for field in row.get('fields', []):
                            process_field(data, field)
                        for col in row.get('cols', []):
                            process_field(data, col)
                            
        elif section.get('type') == 'table':
            resolved_body_rows = []
            
            # 1. Process body_rows (the actual line items)
            body_rows_def = section.get('body_rows')
            if isinstance(body_rows_def, dict):
                source = body_rows_def.get('source')
                if source:
                    try:
                        items = get_by_dot_notation(data, source)
                        for item in items:
                            new_row = {'type': 'data_row', 'columns': []}
                            for key, val in item.items():
                                new_col = {
                                    'col_id': key,
                                    'resolved_value': apply_format(val, None) # format could be applied based on header columns if needed
                                }
                                new_row['columns'].append(new_col)
                            resolved_body_rows.append(new_row)
                    except MissingKeyError:
                        pass

            # 2. Add filler rows
            min_empty_rows = 0
            if isinstance(body_rows_def, dict):
                min_empty_rows = body_rows_def.get('min_empty_rows', 0)
            
            filler_count = max(0, min_empty_rows - len(resolved_body_rows))
            for _ in range(filler_count):
                resolved_body_rows.append({'type': 'empty_row', 'columns': []})

            # 3. Process sub_rows_after_items
            sub_rows = section.get('sub_rows_after_items', [])
            for row_def in sub_rows:
                source = row_def.get('source')
                if source:
                    try:
                        items = get_by_dot_notation(data, source)
                        for item in items:
                            new_row = copy.deepcopy(row_def)
                            for col in new_row.get('columns', []):
                                process_table_col(data, col, item)
                            resolved_body_rows.append(new_row)
                    except MissingKeyError:
                        pass
                else:
                    new_row = copy.deepcopy(row_def)
                    for col in new_row.get('columns', []):
                        process_table_col(data, col, {})
                    resolved_body_rows.append(new_row)
                    
            section['resolved_body_rows'] = resolved_body_rows
            
            footer_row = section.get('footer_row')
            if footer_row:
                if 'quantity_col' in footer_row:
                    process_table_col(data, footer_row['quantity_col'], {})
                if 'amount_col' in footer_row:
                    process_table_col(data, footer_row['amount_col'], {})
                    
        elif section.get('type') in ['full_width_text', 'full_width_centered_text']:
            process_field(data, section)

    return context

