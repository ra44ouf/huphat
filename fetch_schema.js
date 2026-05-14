async function run() {
  const url = 'https://adxqokcmjwhmqpvjtonx.supabase.co/rest/v1/videos?limit=1';
  const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeHFva2NtandobXFwdmp0b254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MDcyNTMsImV4cCI6MjA4ODk4MzI1M30.pVvOlvv0otc1Y2KXdgt_bRV74b-Eru-FiIVVm-vmCsI';
  
  const res = await fetch(url, {
    method: 'OPTIONS',
    headers: {
      'apikey': apikey,
      'Authorization': 'Bearer ' + apikey
    }
  });
  
  const text = await res.text();
  console.log('OPTIONS output:', text);

  const res2 = await fetch(url, {
    headers: {
      'apikey': apikey,
      'Authorization': 'Bearer ' + apikey
    }
  });
  console.log('GET output:', await res2.json());
}
run();
