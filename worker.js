addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Extract the arXiv PDF URL from the request
  const { searchParams } = new URL(request.url)
  const pdfUrl = searchParams.get('pdfUrl')

  if (!pdfUrl) {
    return new Response('Missing pdfUrl parameter', { status: 400 })
  }

  try {
    // Fetch the PDF from arXiv
    const response = await fetch(pdfUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`)
    }

    // Return the PDF response
    return new Response(response.body, {
      headers: {
        'Content-Type': 'application/pdf',
      },
    })
  } catch (error) {
    return new Response(`Error fetching PDF: ${error.message}`, { status: 500 })
  }
}