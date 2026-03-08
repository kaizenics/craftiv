import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ResumeData } from '@/lib/types/resume';
import { DesignOptions } from './styles';
import { ResumeTemplate } from '@/lib/types/resume';

interface PDFGeneratorOptions {
  data: ResumeData;
  template: ResumeTemplate;
  fileName: string;
  designOptions: DesignOptions;
  customColor?: string;
}

// Check if a color value uses modern CSS color functions that html2canvas doesn't support
function isModernColorFunction(value: string): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return lower.includes('lab(') || 
         lower.includes('lch(') || 
         lower.includes('oklch(') || 
         lower.includes('oklab(');
}

// Convert modern color format to RGB using browser's native conversion
function convertToRgb(doc: Document, value: string, fallback: string): string {
  try {
    const temp = doc.createElement('div');
    temp.style.color = value;
    temp.style.position = 'absolute';
    temp.style.left = '-10000px';
    temp.style.visibility = 'hidden';
    doc.body.appendChild(temp);
    
    const win = doc.defaultView || window;
    const computed = win.getComputedStyle(temp).color;
    doc.body.removeChild(temp);
    
    // Check if conversion was successful (should be rgb/rgba format)
    if (computed && !isModernColorFunction(computed)) {
      return computed;
    }
  } catch (e) {
    // Fall through to fallback
  }
  return fallback;
}

// Convert all modern color functions in an element's styles to RGB
function normalizeElementColors(doc: Document, el: HTMLElement) {
  const win = doc.defaultView || window;
  
  try {
    const computed = win.getComputedStyle(el);
    
    // CSS color properties that might contain modern color functions
    const colorProps = [
      { css: 'background-color', fallback: 'transparent' },
      { css: 'color', fallback: '#000000' },
      { css: 'border-color', fallback: 'transparent' },
      { css: 'border-top-color', fallback: 'transparent' },
      { css: 'border-bottom-color', fallback: 'transparent' },
      { css: 'border-left-color', fallback: 'transparent' },
      { css: 'border-right-color', fallback: 'transparent' },
      { css: 'outline-color', fallback: 'transparent' },
      { css: 'box-shadow', fallback: 'none' },
      { css: 'text-decoration-color', fallback: 'currentcolor' },
    ];
    
    colorProps.forEach(({ css, fallback }) => {
      try {
        const value = computed.getPropertyValue(css);
        if (isModernColorFunction(value)) {
          const rgbValue = convertToRgb(doc, value, fallback);
          el.style.setProperty(css, rgbValue, 'important');
        }
      } catch (e) {
        // Skip this property
      }
    });
  } catch (e) {
    // Skip this element
  }
}

export async function generatePDF({ 
  data, 
  template, 
  fileName, 
  designOptions,
  customColor 
}: PDFGeneratorOptions) {
  // Find the dedicated hidden export preview first, then fall back to any visible preview
  let resumeElement = document.querySelector('[data-resume-export-preview] [data-resume-preview]') as HTMLElement;
  
  if (!resumeElement) {
    // Fallback to any resume preview element
    resumeElement = document.querySelector('[data-resume-preview]') as HTMLElement;
  }
  
  if (!resumeElement) {
    throw new Error('Resume preview element not found. Please ensure the resume is rendered on the page.');
  }
  
  // Verify that page 2 content exists
  const hasPage2Content = resumeElement.querySelector('[data-pdf-content]') !== null;
  console.log(`[PDF Generator] Found resume element, has page 2 content: ${hasPage2Content}`);
  
  // Clone the current element
  const clonedElement = resumeElement.cloneNode(true) as HTMLElement;

  // Create a temporary container with proper dimensions for PDF
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'fixed';
  tempContainer.style.top = '-10000px'; // Render off-screen for speed
  tempContainer.style.left = '0';
  tempContainer.style.width = '210mm';
  tempContainer.style.height = 'auto';
  tempContainer.style.backgroundColor = 'white';
  tempContainer.style.overflow = 'visible';
  document.body.appendChild(tempContainer);

  // Set proper dimensions for PDF (A4: 210mm x 297mm)
  clonedElement.style.width = '210mm';
  clonedElement.style.maxWidth = '210mm';
  clonedElement.style.minHeight = 'auto';
  clonedElement.style.backgroundColor = '#ffffff';
  clonedElement.style.boxShadow = 'none';
  clonedElement.style.borderRadius = '0';
  clonedElement.style.overflow = 'visible'; // CRITICAL: Remove overflow-hidden to capture full height
  clonedElement.style.height = 'auto'; // Let it grow to full content height
  
  // Ensure content container is visible and shows all content
  const contentContainer = clonedElement.querySelector('[data-resume-content]') as HTMLElement;
  if (contentContainer) {
    contentContainer.style.overflow = 'visible';
    contentContainer.style.display = 'block';
    contentContainer.style.height = 'auto'; // Let it grow to full content
    contentContainer.style.maxHeight = 'none'; // Remove any max-height restrictions
    
    // Make all children visible (this will show both pages if they're conditionally rendered)
    Array.from(contentContainer.children).forEach((child: Element) => {
      const htmlChild = child as HTMLElement;
      htmlChild.style.display = 'block';
      htmlChild.style.visibility = 'visible';
      htmlChild.style.opacity = '1';
      htmlChild.style.height = 'auto';
      htmlChild.style.overflow = 'visible';
    });
  }
  
  // Also ensure the PDF content wrapper is fully visible
  const pdfContent = clonedElement.querySelector('[data-pdf-content]') as HTMLElement;
  if (pdfContent) {
    pdfContent.style.display = 'block';
    pdfContent.style.visibility = 'visible';
    pdfContent.style.height = 'auto';
    pdfContent.style.overflow = 'visible';
    
    // Debug: Check if additional sections are present
    const hasAwards = pdfContent.textContent?.includes('Awards') || pdfContent.textContent?.includes('AWARDS');
    const hasReferences = pdfContent.textContent?.includes('References') || pdfContent.textContent?.includes('REFERENCES');
    const hasHobbies = pdfContent.textContent?.includes('Hobbies') || pdfContent.textContent?.includes('HOBBIES');
    console.log(`[PDF Generator] Content check - Awards: ${hasAwards}, References: ${hasReferences}, Hobbies: ${hasHobbies}`);
    console.log(`[PDF Generator] PDF content text length: ${pdfContent.textContent?.length || 0} chars`);
  } else {
    console.warn('[PDF Generator] [data-pdf-content] element not found in cloned element!');
  }
  
  // Remove any interactive elements, buttons, pagination, etc.
  clonedElement.querySelectorAll('button, input, select, [data-pagination], [data-score], [data-preview-header], [data-preview-footer], [data-page-break-indicator]').forEach(el => {
    el.remove();
  });
  
  tempContainer.appendChild(clonedElement);

  // CRITICAL: Force a layout recalculation to ensure all content is rendered
  // This is especially important for capturing page 2 content
  void clonedElement.offsetHeight; // Force reflow
  void tempContainer.offsetHeight; // Force reflow
  
  // Wait for all content to be rendered, especially page 2
  let retries = 0;
  const maxRetries = 5;
  while (retries < maxRetries) {
    const pdfContent = clonedElement.querySelector('[data-pdf-content]');
    const scrollHeight = clonedElement.scrollHeight;
    const offsetHeight = clonedElement.offsetHeight;
    
    // Wait a bit for React to finish rendering
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Check if height has stabilized (content fully rendered)
    const newScrollHeight = clonedElement.scrollHeight;
    if (newScrollHeight === scrollHeight && pdfContent) {
      console.log(`[PDF Generator] Content stabilized after ${retries + 1} retries. Height: ${scrollHeight}px`);
      break;
    }
    
    retries++;
    if (retries >= maxRetries) {
      console.warn(`[PDF Generator] Content may not be fully rendered after ${maxRetries} retries`);
    }
  }

  let canvas: HTMLCanvasElement;
  
  try {
    // Get the actual scroll height after all content is rendered
    const actualHeight = Math.max(
      clonedElement.scrollHeight,
      clonedElement.offsetHeight,
      tempContainer.scrollHeight
    );
    const actualWidth = clonedElement.scrollWidth || clonedElement.offsetWidth;
    
    console.log(`[PDF Generator] Capturing element - Width: ${actualWidth}px, Height: ${actualHeight}px`);
    
    // Use html2canvas with optimized settings for speed
    // CRITICAL: Use onclone callback to fix modern color functions BEFORE html2canvas parses CSS
    canvas = await html2canvas(clonedElement, {
      scale: 1.2, // Reduced from 1.5/2.0 for faster rendering while maintaining quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: actualWidth,
      height: actualHeight,
      windowWidth: actualWidth,
      windowHeight: actualHeight,
      imageTimeout: 0, // Don't wait for images to load (already loaded)
      removeContainer: true, // Clean up automatically
      allowTaint: false,
      foreignObjectRendering: false,
      onclone: (clonedDoc) => {
        // Fix modern color functions (oklch, lab, lch, oklab) in the cloned document
        // html2canvas doesn't support these modern CSS color formats
        const win = clonedDoc.defaultView || window;
        
        // Step 1: Inject a style tag to override CSS custom properties with RGB values
        // This ensures html2canvas doesn't try to parse oklch/lab values from stylesheets
        const overrideStyle = clonedDoc.createElement('style');
        overrideStyle.id = 'html2canvas-color-fix';
        
        // Get computed CSS custom properties from :root and convert to RGB
        const rootStyles = win.getComputedStyle(clonedDoc.documentElement);
        const cssVarOverrides: string[] = [];
        
        // List of CSS custom properties that typically contain colors
        const colorVarNames = [
          '--background', '--foreground', '--card', '--card-foreground',
          '--popover', '--popover-foreground', '--primary', '--primary-foreground',
          '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
          '--accent', '--accent-foreground', '--destructive', '--border', '--input',
          '--ring', '--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5',
          '--sidebar', '--sidebar-foreground', '--sidebar-primary', '--sidebar-primary-foreground',
          '--sidebar-accent', '--sidebar-accent-foreground', '--sidebar-border', '--sidebar-ring'
        ];
        
        colorVarNames.forEach(varName => {
          try {
            const value = rootStyles.getPropertyValue(varName).trim();
            if (value && isModernColorFunction(value)) {
              const rgbValue = convertToRgb(clonedDoc, value, 'inherit');
              if (rgbValue !== 'inherit') {
                cssVarOverrides.push(`${varName}: ${rgbValue} !important;`);
              }
            }
          } catch (e) {
            // Skip this variable
          }
        });
        
        if (cssVarOverrides.length > 0) {
          overrideStyle.textContent = `:root { ${cssVarOverrides.join(' ')} }`;
          clonedDoc.head.appendChild(overrideStyle);
        }
        
        // Step 2: Process all elements to convert computed styles with modern colors
        let convertedCount = 0;
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach((el: Element) => {
          if (el instanceof HTMLElement) {
            const beforeStyles = el.style.cssText;
            normalizeElementColors(clonedDoc, el);
            if (el.style.cssText !== beforeStyles) {
              convertedCount++;
            }
          }
        });
        
        // Step 3: Fix root elements explicitly with safe colors
        if (clonedDoc.documentElement) {
          clonedDoc.documentElement.style.backgroundColor = '#ffffff';
          clonedDoc.documentElement.style.color = '#000000';
        }
        if (clonedDoc.body) {
          clonedDoc.body.style.backgroundColor = '#ffffff';
          clonedDoc.body.style.color = '#000000';
        }
        
        // Step 4: Fix the target element being captured
        const targetElement = clonedDoc.querySelector('[data-resume-preview]') as HTMLElement;
        if (targetElement) {
          targetElement.style.backgroundColor = '#ffffff';
        }
        
        console.log(`[PDF Generator] Applied ${cssVarOverrides.length} CSS variable overrides, converted ${convertedCount} elements`);
      },
    });

    // Calculate PDF dimensions (A4: 210mm x 297mm)
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    console.log(`[PDF Generator] Canvas dimensions - Width: ${canvas.width}px, Height: ${canvas.height}px`);
    console.log(`[PDF Generator] PDF dimensions - Width: ${imgWidth}mm, Height: ${imgHeight.toFixed(2)}mm`);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true, // Enable compression for faster generation
    });

    // Convert to JPEG for faster processing (smaller file size)
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // Calculate total number of pages needed
    const totalPages = Math.ceil(imgHeight / pageHeight);
    
    console.log(`[PDF Generator] Image height: ${imgHeight.toFixed(2)}mm, Page height: ${pageHeight}mm, Total pages: ${totalPages}`);

    if (totalPages === 0) {
      throw new Error('No content to generate PDF');
    }

    // Add each page
    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }
      
      // Calculate the Y position to show the correct portion of the image
      // For page 0: position = 0 (shows top of image)
      // For page 1: position = -297 (shows content from 297mm onwards)
      // For page 2: position = -594 (shows content from 594mm onwards)
      const yPosition = -(page * pageHeight);
      
      console.log(`[PDF Generator] Adding page ${page + 1}/${totalPages} with Y position: ${yPosition}mm`);
      
      pdf.addImage(imgData, 'JPEG', 0, yPosition, imgWidth, imgHeight, undefined, 'FAST');
    }

    // Save the PDF
    pdf.save(`${fileName}.pdf`);
    
    console.log(`[PDF Generator] Successfully generated ${totalPages}-page PDF: ${fileName}.pdf`);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  } finally {
    // Clean up temp container
    if (document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }
  }
}
 
