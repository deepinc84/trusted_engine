const url=process.env.NEXT_PUBLIC_SUPABASE_URL??"";
if(process.env.ESTIMATOR_INTEGRATION_TEST!=="1")throw new Error("Set ESTIMATOR_INTEGRATION_TEST=1 to run the workflow harness.");
if(process.env.NODE_ENV==="production"||process.env.VERCEL_ENV==="production"||(process.env.PRODUCTION_SUPABASE_URL&&url===process.env.PRODUCTION_SUPABASE_URL)||/prod(uction)?[.-]/i.test(url))throw new Error("Integration tests are blocked against production.");
console.log(process.env.INTEGRATION_USE_MOCK==="1"?"Using the isolated in-memory workflow adapter.":"Disposable Supabase environment guard passed.");
