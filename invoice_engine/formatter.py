import math
from datetime import datetime

def format_indian_currency(amount: float, symbol: bool = False) -> str:
    if amount is None or amount == "":
        return ""
    try:
        amount = float(amount)
    except ValueError:
        return str(amount)
        
    is_negative = amount < 0
    amount = abs(amount)
    amount_rounded = round(amount, 2)
    
    integer_part = int(amount_rounded)
    decimal_part = f"{amount_rounded:.2f}".split('.')[1]
    
    s = str(integer_part)
    res = ""
    if len(s) > 3:
        res = "," + s[-3:]
        s = s[:-3]
        while len(s) > 2:
            res = "," + s[-2:] + res
            s = s[:-2]
        res = s + res
    else:
        res = s
        
    formatted = f"{res}.{decimal_part}"
    if is_negative:
        formatted = "-" + formatted
        
    if symbol:
        return f"₹{formatted}"
    return formatted

def format_date(date_str: str) -> str:
    if not date_str:
        return ""
    try:
        # Assuming input is YYYY-MM-DD
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%d-%b-%y").upper()
    except ValueError:
        return str(date_str)

def apply_format(value, format_rule):
    if value is None or value == "":
        return ""
    if format_rule == "indian_currency_with_symbol":
        return format_indian_currency(value, symbol=True)
    elif format_rule == "indian_currency_no_symbol":
        return format_indian_currency(value, symbol=False)
    elif format_rule == "date":
        return format_date(str(value))
    return str(value)
