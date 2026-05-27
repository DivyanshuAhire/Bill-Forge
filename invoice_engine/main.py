import sys
import os
from parser import parse_and_resolve, MissingKeyError
from renderer import render_html, TemplateRenderError
from pdf_export import html_to_pdf, PDFExportError

def validate_totals(data: dict):
    try:
        totals = data.get('invoice', {}).get('totals', {})
        subtotal = float(totals.get('subtotal', 0))
        total_tax = float(totals.get('total_tax', 0))
        round_off = float(totals.get('round_off', 0))
        grand_total = float(totals.get('grand_total', 0))
        
        calculated_total = subtotal + total_tax + round_off
        
        if abs(calculated_total - grand_total) > 0.01:
            print(f"Validation Error: Totals do not match. Subtotal({subtotal}) + Tax({total_tax}) + RoundOff({round_off}) = {calculated_total} != GrandTotal({grand_total})")
            sys.exit(1)
    except ValueError as e:
        print(f"Validation Error: Could not parse totals as floats - {e}")
        sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print("Usage: python main.py <invoice.json>")
        sys.exit(1)
        
    json_path = sys.argv[1]
    if not os.path.exists(json_path):
        print(f"Error: File {json_path} not found.")
        sys.exit(1)
        
    base_name = os.path.splitext(os.path.basename(json_path))[0]
    dir_name = os.path.dirname(os.path.abspath(json_path))
    html_path = os.path.join(dir_name, f"{base_name}.html")
    pdf_path = os.path.join(dir_name, f"{base_name}.pdf")

    try:
        # 1. Parse and resolve
        context = parse_and_resolve(json_path)
        
        # Validation
        validate_totals(context)
        
        # 2. Render HTML
        render_html(context, html_path)
        
        # 3. Export PDF
        html_to_pdf(html_path, pdf_path)
        
        print(f"Successfully generated PDF: {pdf_path}")
        
        # Optional: clean up html
        if os.path.exists(html_path):
            os.remove(html_path)
            
    except MissingKeyError as e:
        print(f"MissingKeyError: {str(e)}")
        sys.exit(1)
    except TemplateRenderError as e:
        print(f"TemplateRenderError: {str(e)}")
        sys.exit(1)
    except PDFExportError as e:
        print(f"PDFExportError: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
