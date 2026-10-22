/**
 * The font families resumes and cover letters can be set in. React hoists this stylesheet into <head> once,
 * only on pages that render a preview, so marketing pages never download it.
 */
export function TemplateFonts() {
  // eslint-disable-next-line @next/next/no-page-custom-font -- Pages Router rule; React 19 hoists and dedupes this.
  return <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Lato:wght@400;700&family=Montserrat:wght@400;600;700&family=Poppins:wght@400;500;600;700&family=Source+Sans+Pro:wght@400;600;700&family=Nunito:wght@400;600;700&family=Raleway:wght@400;500;700&family=Merriweather:wght@400;700&family=Lora:wght@400;500;600;700&family=EB+Garamond:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&display=swap" precedence="default" />;
}
