const base_url = "https://arxiv.org/"
const compressing = require('compressing');

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function processSingleFile(pathname) {
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
      'Content-Disposition': `attachment; filename=${filename}`
      },
    })
  } catch (error) {
    return new Response(`Error fetching PDF: ${error.message}`, { status: 500 })
  }
}

async function processAllFile(pathname) {
  const id = pathname.split('/')[1]
  if (!id) {
    return new Response('Missing paper id', { status: 400 })
  }

  const pdfUrl = base_url + "pdf/" + id
  const texUrl = base_url + "src/" + id

  const pdfResponse = await fetch(pdfUrl)
  const texResponse = await fetch(texUrl)
  if (!pdfResponse.ok || !texResponse.ok) {
    throw new Error('Failed to fetch files')
  }

  const zip = new JSZip();
  zip.file(`${id}.pdf`, await pdfResponse.blob());
  zip.file(`${id}.tex`, await texResponse.blob());

  const zipBlob = await zip.generateAsync({type: 'blob'});

  return new Response(zipBlob, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename=${id}.zip`
    }
  });
}

async function handleRequest(request) {
  // Extract the arXiv PDF URL from the request
  const url = new URL(request.url)
  const { searchParams, pathname } = url
  console.log("searchParams", searchParams)
  console.log("pathname", pathname)
  const parameterCount = pathname.split('/').length
  if (parameterCount === 1) {
    return processAllFile(pathname)
  } else if (parameterCount === 2) {
    return processSingleFile(pathname)
  } else {
    return new Response('Invalid URL', { status: 400 })
  }
  
}