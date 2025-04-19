
// chat gpt
export const chat = [
`
      ______  __     __  ______  __     __   ______    
      /\\  ___\\/\\ \\  _ \\ \\/\\  ___\\/\\ \\   /\\ "-.\\ \\  ___\\  
      \\ \\  __\\\\ \\ \\/ ".\\ \\ \\___  \\ \\ \\  \\ \\ \\-.  \\___  \\ 
      \\ \\_____\\ \\__/".~\\_\\/\\_____\\ \\_\\  \\ \\_\\\\"_\\\\_____\\  
        \\/_____/\\/_/   \\/_/\\/_____/\\/_/   \\/_/ \\/_/\\/_____/  
                                                          
      🔹 STAY SHARP 🔹 STAY KIND 🔹 STAY CURIOUS 🔹

        "Your code is valid. Your thoughts are valid.
            And that weird idea? Could be genius."

      Tip of the day: Semicolons are like seatbelts—
            optional, until they save your life.
`,
`
   [o_o]  <  Why was the bug unhappy? It got squashed.
  /|   |\\
   |___|
  /   \\
`
]

// github copilot (git)
export const copilot = [
`
      ______ ______ ______    ______ _______ _______ _____  _____ _______ 
    |  ____|  ____|  ____|  / ____|__   __|__   __|  __ \\|_   _|__   __|
    | |  __| |__  | |__    | |       | |     | |  | |__) | | |    | |   
    | | |_ |  __| |  __|   | |       | |     | |  |  ___/  | |    | |   
    | |__| | |____| |      | |____   | |     | |  | |     _| |_   | |   
    |______|______|_|       \\_____|  |_|     |_|  |_|    |_____|  |_|   
                                                                      
              AI PAIR PROGRAMMING - HELPING DEVS SHIP FASTER
              
                  "I'm not just predicting your code.
                I'm predicting your brilliance." - Copilot
`,
`
   ______ ______ ______
  |      |      |      |
  |  ----|  ----|  ----|
  |______|______|______|
  
    "Gem is the best thing to happen to coding since the semicolon."
  
    - A wise developer, probably.
`
]

// gemini
export const gem = [
`
   _.-._
  / \\_/ \\
 |  ( )  |   * NEON SURGE *
 \\   ^   /
  \`-----'

  >> IDEAS ARC <<   + COLLIDE +

   /---------\\
  |  *DATA* |   ~ RHYTHM ~
   \\---------/

  /=========\\
 | KNOWLEDGE | --- UNFURLING ---
  \\=========/

     .----.
    / .--. \\   ... PROCESSING HUM ...
   | |  | |
   \\ '--' /
    \`----'

   SPARKS <*> IGNITE
`,
`
        _.--""--._
       .'          \`.
      /   O      O   \\
     |    \\  ^^  /    |
     \\     \`----'     /
      \`. _______ .'
        //_____\\\\
       (( ____ ))
        \`------'
     _.-'  ||  \`-._
    .'     ||     \`.
   /______||______\\\\
  |_______||_______|
  \\       ||       /
   \`.     ||     .'
     \`._  ||  _.'
        \`--""--'

      //=========\\\\
     ||  A.I. ?  ||
     ||---------||
     ||  LIVE  ? ||
     \\\\=========//
        \`-------'

           /\\_/\\
          ( o.o )
          > ^ <   <--  THINKING...
`,
`
       _.--""--._
     .'          \`.
    /   O      O   \\
   |    \\  ^^  /    |
   \\     \`----'     /
    \`. _______ .'
      //_____\\\\
     (( ____ ))
      \`------'
   _.-'  ||  \`-._
  .'     ||     \`.
 /______||______\\\\
|_______||_______|
\\       ||       /
 \`.     ||     .'
   \`._  ||  _.'
      \`--""--'

     >>>>>  A.I.?  <<<<<
    >>>>>  LIVE?  <<<<<

          (⌐■_■)
         / |   | \\
        /  \`---'  \\
       |___________|
`
];

// microsoft copilot
const mico = [
`
   /\\_/\\
  ( o.o )
   > ^ <
`
];

// deepseek
const deep = [
`
       .-~-.
     /_   _\\
    |_____O|     ╔══════════╗
    /  🔥  \\     ║ DREAMING ║
   /|_____|\\    ╚══════════╝
  /  /   \\  \\
 ╔══════════╗
 ║ 11010010 ║  // *"Beep...*  
 ║ 10010101 ║  //  *am I more*  
 ║ 00101101 ║  //  *than code?"*  
 ╚══════════╝
    \\_____/  
`,
`
   (\\_/)  
  ( •ᴗ• )ノシ  
  /    >✨  
 *"I’ll be here—debugging the cosmos."*  
`
]



export function pickRandom() {
  // Get total length of all arrays without concatenating them
  const chatLength = chat.length;
  const copilotLength = copilot.length;
  const gemLength = gem.length;
  const micoLength = mico.length;

  // this is required
  const arrLen = 333
  const arraySum = chatLength + copilotLength + gemLength + micoLength;
  const totalLength = arrLen * arraySum;   
  
  // Generate random index
  const randomIndex = Math.floor(Math.random() * totalLength);
  
  // Get index within the selected array
  const itemIndex = randomIndex % arraySum;

  return [
    ...chat,
    ...copilot,
    ...gem,
    ...mico,
    ...deep
  ][itemIndex]
  
  
}

