const BASE_URL =
  'https://api.exchangerate-api.com/v4/latest/:base_currency';

const dropdowns=document.querySelectorAll(".dropdown select");
const btn=document.querySelector("form button");
const fromcurr=document.querySelector(".from select");
const tocurr=document.querySelector(".to select");
const msg=document.querySelector("msg");

// for(code in countryList){
//     console.log(code, countryList);
// }

for(let select of dropdowns){
    for(currCode in countryList){
        let newopt=document.createElement("option");
        newopt.innerText=currCode;
        newopt.value=currCode;
        if(select.name ==="from"&& currCode==="USD"){
          newopt.selected='selected';
        } else if(select.name ==="to"&& currCode==="INR"){
          newopt.selected='selected';
        }
        select.append(newopt);
       }

      select.addEventListener("change",(evt)=>{
          updflag(evt.target)
      });
}
 const updflag=(element) =>{
    let currCode=element.value;
    let countrycode=countryList[currCode];
    let newsrc=`https://flagsapi.com/${countrycode}/flat/64.png`;
    let img = element.parentElement.querySelector('img');
    img.src=newsrc;
    console.log(currCode);
 };

 btn.addEventListener("click",async(evt)=>{
  evt.preventDefault();
  let amount=document.querySelector(".amount input");
  let amtval=amount.value;
  if(amtval===""||amount<1){
    amtval=1;
    amount.value="1";
  }
  console.log(fromcurr.value,tocurr.value);
 const URL=`BASE_URL/${fromcurr.value.toLowerCase()}/${tocurr.value.toLowerCase()}.json`;
 let response=await fetch(URL);
 let data= await response.json();
 let rate=data[tocurr.value.toLowerCase()]
 console.log(rate);
counsole.log(amount);
 let finalamt= amtval*rate;
 msg.innerText= `${amtval} ${fromcurr}=${finalamy}${tocurr}`

 });
