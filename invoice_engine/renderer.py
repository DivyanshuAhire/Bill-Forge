import os
from jinja2 import Environment, FileSystemLoader

class TemplateRenderError(Exception):
    pass

def render_html(context: dict, output_path: str = None) -> str:
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        templates_dir = os.path.join(current_dir, 'templates')
        env = Environment(loader=FileSystemLoader(templates_dir))
        template = env.get_template('template.html')
        html_content = template.render(context)
        
        if output_path:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
                
        return html_content
    except Exception as e:
        raise TemplateRenderError(f"Failed to render template: {str(e)}")
