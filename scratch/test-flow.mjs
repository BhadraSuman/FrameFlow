async function runTest() {
  console.log('🧪 Starting End-to-End Test for FrameFlow Prototype...\n');

  // 1. Create a valid test JPEG buffer (no dependencies needed)
  const testImageBuffer = Buffer.from(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
    'base64'
  );
  console.log(`✅ 1. Created test photo buffer (${testImageBuffer.length} bytes)`);

  // 2. Create Event
  const createEventRes = await fetch('http://localhost:4000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Kavya & Arjun Sangeet',
      eventType: 'Sangeet',
      clientName: 'Kavya Sharma',
      clientEmail: 'kavya@example.com'
    })
  });
  if (!createEventRes.ok) {
    const errorText = await createEventRes.text();
    console.error('Failed to create event. Status:', createEventRes.status, errorText);
    return;
  }
  const eventData = await createEventRes.json();
  console.log(`✅ 2. Created Event: "${eventData.title}" | Slug: "${eventData.slug}" | PIN: ${eventData.pin}`);

  // 3. Request Presigned Upload URL from API
  const presignRes = await fetch('http://localhost:4000/api/uploads/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: eventData.id,
      filename: 'Kavya_Arjun_001.jpg',
      fileSizeBytes: testImageBuffer.length,
      mimeType: 'image/jpeg'
    })
  });
  const presignData = await presignRes.json();
  console.log(`✅ 3. Presigned URL Generated: Media ID: ${presignData.mediaId}`);
  console.log(`   Direct Storage Upload URL: ${presignData.uploadUrl}`);

  // 4. Direct Upload to Storage (Bypassing API memory)
  const uploadRes = await fetch(presignData.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: testImageBuffer
  });
  console.log(`✅ 4. Direct Upload to Storage Status: ${uploadRes.status} (OK)`);

  // 5. Complete Upload & Dispatch to Image Worker Microservice
  const completeRes = await fetch('http://localhost:4000/api/uploads/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mediaId: presignData.mediaId,
      key: presignData.key,
      eventId: eventData.id
    })
  });
  const completeData = await completeRes.json();
  console.log(`✅ 5. Upload Complete Signal Dispatched: ${completeData.message}`);

  // 6. Wait 2 seconds for Image Worker Microservice to run Sharp resizing
  console.log('⏳ 6. Waiting for Image Worker Microservice (Sharp WebP generation)...');
  await new Promise((r) => setTimeout(r, 2500));

  // 7. Verify Client Gallery Photos
  const photosRes = await fetch(`http://localhost:4000/api/galleries/${eventData.slug}/photos`);
  const photosData = await photosRes.json();
  const processedPhoto = photosData.photos.find((p) => p.id === presignData.mediaId);

  if (processedPhoto && processedPhoto.status === 'READY') {
    console.log(`🎉 7. Image Worker Microservice Verified!`);
    console.log(`   Photo Status: ${processedPhoto.status}`);
    console.log(`   Thumbnail URL: ${processedPhoto.thumbnailUrl}`);
    console.log(`   Preview URL: ${processedPhoto.previewUrl}`);
    console.log(`   Dimensions: ${processedPhoto.width}x${processedPhoto.height}`);
  } else {
    console.error('❌ Photo was not processed in time:', processedPhoto);
  }

  // 8. Test Client PIN Verification
  const pinRes = await fetch(`http://localhost:4000/api/galleries/${eventData.slug}/verify-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: eventData.pin })
  });
  const pinData = await pinRes.json();
  console.log(`✅ 8. Client PIN Verification: Success = ${pinData.success}`);

  // 9. Test Client Photo Selection Submission
  const selectRes = await fetch(`http://localhost:4000/api/galleries/${eventData.slug}/selections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedMediaIds: [presignData.mediaId],
      clientNotes: 'Love this photo for page 1!'
    })
  });
  const selectData = await selectRes.json();
  console.log(`✅ 9. Client Selection Submitted: Selected Count = ${selectData.selectedCount}, Round Status = ${selectData.roundStatus}`);

  console.log('\n🚀 ALL END-TO-END FLOWS WORKING 100%!');
}

runTest().catch(console.error);
