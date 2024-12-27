import JSZip from 'jszip';

const base_url = "https://arxiv.org/";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

async function processSingleFile(pathname) {
  const [_, type, id] = pathname.split('/');
  if (!id || !type) {
    return new Response('Missing paper id or type', { status: 400 });
  }

  const url = type === 'pdf' ? 
    base_url + "pdf/" + id :
    base_url + "src/" + id;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch file');
  }

  const contentType = type === 'pdf' ? 'application/pdf' : 'application/x-tex';
  return new Response(response.body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename=${id}.${type}`,
      ...corsHeaders
    }
  });
}

async function processAllFile(pathname) {
  const id = pathname.split('/')[1];
  if (!id) {
    return new Response('Missing paper id', { status: 400 });
  }

  const pdfUrl = base_url + "pdf/" + id;
  const texUrl = base_url + "src/" + id;

  const pdfResponse = await fetch(pdfUrl);
  const texResponse = await fetch(texUrl);
  if (!pdfResponse.ok || !texResponse.ok) {
    throw new Error('Failed to fetch files');
  }

  const zip = new JSZip();
  zip.file(`${id}.pdf`, await pdfResponse.blob());
  zip.file(`${id}.tex`, await texResponse.blob());

  const zipBlob = await zip.generateAsync({type: 'blob'});

  return new Response(zipBlob, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename=${id}.zip`,
      ...corsHeaders
    }
  });
}

async function handleRequest(request) {
  try {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const { pathname } = url;
    const parameterCount = pathname.split('/').filter(Boolean).length;

    if (parameterCount === 1) {
      return processAllFile(pathname);
    } else if (parameterCount === 2) {
      return processSingleFile(pathname);
    } else {
      return new Response('Invalid URL', { 
        status: 400,
        headers: corsHeaders 
      });
    }
  } catch (error) {
    return new Response(error.message, { 
      status: 500,
      headers: corsHeaders 
    });
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});