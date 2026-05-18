export async function POST(request: Request) {
  const pinataJwt = process.env.PINATA_JWT;

  if (!pinataJwt) {
    return Response.json(
      { error: "PINATA_JWT is not configured." },
      { status: 500 },
    );
  }

  const requestFormData = await request.formData();
  const file = requestFormData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "No file was provided." }, { status: 400 });
  }

  const pinataFormData = new FormData();
  pinataFormData.append("file", file, file.name);
  pinataFormData.append(
    "pinataMetadata",
    JSON.stringify({
      name: file.name,
    }),
  );

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pinataJwt}`,
    },
    body: pinataFormData,
  });

  const data = (await response.json()) as {
    IpfsHash?: string;
    error?: string;
    message?: string;
  };

  if (!response.ok || !data.IpfsHash) {
    return Response.json(
      {
        error: data.error ?? data.message ?? "Pinata upload failed.",
      },
      { status: response.status },
    );
  }

  return Response.json({
    cid: data.IpfsHash,
    url: `ipfs://${data.IpfsHash}`,
  });
}
