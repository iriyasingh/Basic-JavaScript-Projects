let userscore=0;
let compscore=0;

const choices=document.querySelectorAll(".choice");
const msg=document.querySelector("#msg");

const userscorepara=document.querySelector("#userscore");
const compscorepara=document.querySelector("#compscore");

const drawgame=()=>{
    console.log('game is draw');
     msg.innerText=("draw!!");
};

const showwinner=(userwin,userchoice,compchoice)=>{
    if(userwin){
        userscore++;
        userscorepara.innerText=userscore;
        console.log("you win!!");
        msg.innerText="You win!!";
        msg.style.backgroundColor="green";
    }else{
        compscore++;
        compscorepara.innerText=compscore;
        console.log("you lose!!");
        msg.innerText="You lose.";
        msg.style.backgroundColor="red";
    }
}

const gencompchoice =()=>{
    const option =['roack','paper','scissor'];
   const randidx= Math.floor(Math.random()*3);
   return option[randidx];
}
const playgame=(userchoice)=>{
    console.log("userchoice=",userchoice);
    const compchoice=gencompchoice();
    console.log("comp choice=",compchoice);

    if(userchoice==compchoice){
        drawgame();
      }  else{
            let userwin=true;
            if(userchoice==='rock'){
               userwin= compchoice==='paper'?false:true;
            }else if(userchoice==='paper'){
               userwin= compchoice==='scissors'?false:true;
            }else {
                userwin=compchoice==='rock'?false:true;
            }
           showwinner(userwin); 
        }

    
};

choices.forEach((choice)=>{
    choice.addEventListener('click',()=>{
        const userchoice=choice.getAttribute("id");
        console.log("choice was clicked",userchoice);
        playgame(userchoice)
    });
});







