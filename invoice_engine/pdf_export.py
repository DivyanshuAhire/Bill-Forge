from playwright.sync_api import sync_playwright
import os

class PDFExportError(Exception):
    pass

def html_to_pdf(html_path: str, pdf_path: str):
    if not os.path.exists(html_path) or os.path.getsize(html_path) == 0:
        raise PDFExportError(f"HTML file {html_path} does not exist or is empty.")
        
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            # use absolute file url
            abs_html_path = os.path.abspath(html_path).replace('\\', '/')
            page.goto(f"file:///{abs_html_path}")
            page.pdf(
                path=pdf_path,
                format="A4",
                print_background=True,
                margin={"top":"10mm","bottom":"10mm","left":"10mm","right":"10mm"}
            )
            browser.close()
            
        if not os.path.exists(pdf_path) or os.path.getsize(pdf_path) == 0:
            raise PDFExportError("Generated PDF is zero bytes.")
            
    except Exception as e:
        raise PDFExportError(f"Playwright failed to generate PDF: {str(e)}")
