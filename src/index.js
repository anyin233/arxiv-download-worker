const base_url = "https://arxiv.org/"

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Extract the arXiv PDF URL from the request
  const url = new URL(request.url)
  const { searchParams, pathname } = url
  console.log("searchParams", searchParams)
  console.log("pathname", pathname)
  const type = pathname.split('/')[1]
  const id = pathname.split('/')[2]
  if (!type || !id) {
    return new Response('Missing file type and paper id', { status: 400 })
  }

  const fullUrl = base_url + type + "/" + id

  try {
    // Fetch the target file from arXiv
    const response = await fetch(fullUrl)
    const contentDisposition = response.headers.get('content-disposition')
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1].replace(/["']/g, '')
      : `${id}.${type}`
    console.log('Filename:', filename)
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }

    // Return the file response
    return new Response(response.body, {
      headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`
      },
    })
  } catch (error) {
    return new Response(`Error fetching PDF: ${error.message}`, { status: 500 })
  }
}