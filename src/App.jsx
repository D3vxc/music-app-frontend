import Router from './Router'
import axios from 'axios';
// import { useState, useEffect } from 'react';

axios.defaults.baseURL = "http://localhost:3000";
function App() {
  return <>
    {/* <Test /> */}
    <Router />
  </>
}


// function Test() {
//   const [res, setRes] = useState()
//   useEffect(() => {
//     axios.get("/").then(data => {
//       setRes(data.data)
//     })
//   }, [])
//   return <div>{res}</div>
// }

export default App;