export async function onRequest(context) {
  const url = new URL(context.request.url);

  // If request comes from climateaction.site, 301 permanently redirect to climamedix.org
  if (url.hostname.includes('climateaction.site')) {
    url.hostname = 'climamedix.org';
    return Response.redirect(url.toString(), 301);
  }

  // Continue normally for climamedix.org and pages.dev
  return context.next();
}
