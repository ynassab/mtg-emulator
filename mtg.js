
class Deck {
	constructor() {
		this.cards = []
	}
}

const DECK = new Deck()
const CARD_SIZE = 244;
const BUFFER = 'height:'+CARD_SIZE*1.395+';width:'+CARD_SIZE;
const BUTTONS_WIDTH = 250;
const CARDS_WIDTH = window.innerWidth - BUTTONS_WIDTH - 18;

async function player_ready() {
	
	var decklist = document.getElementById('decklist_box').value;
	decklist = decklist.split("\n");
	fix_decklist();
	//remove all the 1s at the start
	for (var j = 0; j < decklist.length; j++) {
		decklist[j] = decklist[j].substring(2);
	}
	DECK.cards = decklist;
	DECK.card_imgs = []; // store an array of the images associated with each card
	
	check = await fetch_list(); // check the list to make sure there are no errors
	
	if (check == DECK.cards.length) { // called only if fetch_list checks all cards successfully
		document.body.innerHTML = `
			<br>
			<body>
				<div style='position: relative; float: bottom; margin-top: auto; display: block'>
					<div id='buttons' style='width:`+BUTTONS_WIDTH+`; float: left'>
						<div>
							<button onclick="reveal(\'draw\')">draw</button>
						</div>
						<br>
						<div id="scry_btn_div">
							<button onclick="reveal(\'scry\')">scry</button> <br><br>
						</div>
						<div id="find_div">
							<button onclick="find()">search in deck</button>
						</div>
						<br>
						<div id="add_div">
							<button onclick="add()">add to deck</button>
						</div>
						<br>
						<div>
							<button onclick="shuffle()">shuffle</button>
						</div>
						<br>
						<div id = "load_text"><br>
						</div>
					</div>
					<div id="draw" style='width:`+CARDS_WIDTH+`; margin-left: auto'>
						<div id='buffer' style='`+BUFFER+`'>
						</div>
					</div>
				</div>
				<div id="scry" style='padding-top:100; position: absolute'>
				</div>
			</body>
			<style>
				body { background-image: url(parchment_paper.jpg);
						color: #000;
						font: bold 20px Georgia, serif;
					}
			</style>`
		shuffle();
		document.getElementById('load_text').innerHTML = 'Total cards in deck: ' + DECK.cards.length;
	}
	
	function fix_decklist() {
		try {
			//check the first character of every string and add a new element if it's >1
			for (var i = 0; i < decklist.length; i++) {
				var element = decklist[i];
				var count = element.match(/\d+/)[0]; //extract number at start
				if (count > 1)  {
					var temp_element = element.replace(count, "1");
					decklist.push(temp_element);
					decklist[i] = element.replace(count, count-1); //reduce the count of the card in its original place
					if (count == 1) {
						decklist.splice(i, 1); //remove card from place
					} else {
						fix_decklist(); //repeat if necessary
					}
				}
			}
		}
		catch (e) {
			console.log(e.message);
			document.getElementById('load_text').innerHTML = 'Error encountered while checking decklist. Please check the formatting and try again.';
		}
	}
	
	async function fetch_list() {
		var count = 0;
		try {
			for (i in DECK.cards) {
				let card = DECK.cards[i];
				
				document.getElementById('load_text').innerHTML = 'Loading ' + card; // show progress
				
				// check local storage
				var imgURL = localStorage.getItem(card);
				
				if (imgURL == null) { // fetch image from API
					// let proxy_url = 'https://cors-anywhere.herokuapp.com/' // rectifies lack of Access-Control-Allow-Origin header in the response
					let card_url = 'https://api.scryfall.com/cards/named?fuzzy='+card+'&format=image&version=normal';
					let response = await fetch(card_url);
					var imgURL = await response.url;
					
					//save to local storage
					localStorage.setItem(card, imgURL);
					
					if (!response.ok) { // if error encounted in fetch
						document.getElementById('load_text').innerHTML = 'Unable to identify the card ' + card + '. Please try again.';
						return null
					}
				}
				
				DECK.card_imgs.push([]); // append an element to the array
				DECK.card_imgs[i][0] = card; // name
				DECK.card_imgs[i][1] = localStorage.getItem(card); // img
				
				count += 1;
			}
			return count
		}
		catch (e) {
			console.log(e.message);
			document.getElementById('load_text').innerHTML = 'Error encountered while checking decklist. Please check the formatting and try again.';
		}
	}
}


function URLtext(card_name) {
	// replace characters for URL
	card_name = card_name.replace(/,/g, '');
	card_name = card_name.replace(/'/g, '');
	card_name = card_name.replace(/-/g, '');
	card_name = card_name.replace(/ /g, '+');
	return card_name;
}

function reveal(type) {
	
	var card = DECK.cards[0];
	DECK.cards.shift(); // remove card from deck
	
	// find associated image
	for (var i = 0; i < DECK.card_imgs.length; i++) {
		if (DECK.card_imgs[i][0] == card) { 
			var imgURL = DECK.card_imgs[i][1];
		}
	}
	
	// set image attributes
	var num_cards = document.images.length;
	var card_buffer = num_cards * CARD_SIZE
	var img = document.createElement('img');
	img.style = "left:" + card_buffer.toString(10) + ";width:" + CARD_SIZE.toString(10);
	img.src = imgURL;
	let clock_ = new Date(); // set ID
	var img_id = clock_.getTime(); // not fool-proof if imgs are retrieved too fast somehow
	img.id = img_id;
	var img_id_str = img_id.toString();
	img.setAttribute('crossorigin', 'anonymous'); // sets SameSite attribute to 'Lax' to prevent cookie issues
	
	if (type == 'draw') {
		document.getElementById('buffer').style = '';
		img.setAttribute("onclick", "pop_img("+img_id_str+")");
	}
	else if (type == 'scry') {
		document.getElementById('scry_btn_div').innerHTML = '<button onclick="reveal(\'scry\')">scry</button> <br> Left-click to place on top. Right-click to place on bottom.' // explanatory text
		img.onclick = function(e) {	scry_place(card, img_id_str, 'top'); } // left click to place top
		img.oncontextmenu = function (e) { // right click to place bottom
			e.preventDefault(); // prevent menu from opening
			scry_place(card, img_id_str, 'bot');
		}; 
	}
	
	// display image
	document.getElementById(type).append(img)
	document.getElementById('load_text').innerHTML = 'Cards remaining: ' + DECK.cards.length;
	
}


function getImageData(img) {
	let canvas = document.createElement("canvas");
	canvas.width = img.width;
	canvas.height = img.height;
	let ctx = canvas.getContext("2d");
	ctx.drawImage(img, 0, 0, img.width, img.height);
	return canvas
}

async function pop_img(img_id_str) {
	let img = document.getElementById(img_id_str);
	let canvas = await getImageData(img); // copy to clipboard
	async function waitToCopy() {
		return new Promise((resolve) => {
			canvas.toBlob(blob => navigator.clipboard.write([new ClipboardItem({'image/png': blob})]));
			resolve();
		});
	}
	await waitToCopy();
	img.remove(); // remove img
	// if hand is empty, add buffer (for scry board to appear properly)
	if (document.getElementById('draw').getElementsByTagName('img').length == 0) {
		document.getElementById('buffer').style = BUFFER;
	}
}

function scry_place(card, img_id_str, where) {
	if (where == 'top') {
		DECK.cards.unshift(card); // add to top of decklist
	}
	else if (where == 'bot') {
		DECK.cards.push(card); // add to bottom of decklist
	}
	// remove image
	let img = document.getElementById(img_id_str);
	img.remove();
	// if scry board is empty, empty text
	if (document.getElementById('scry').getElementsByTagName('img').length == 0) {
		document.getElementById('scry_btn_div').innerHTML = '<button onclick="reveal(\'scry\')">scry</button><br><br>';
	}
	document.getElementById('load_text').innerHTML = 'Cards remaining: ' + DECK.cards.length; // update card count
}

function find() {
	
	document.getElementById("find_div").innerHTML = "<button onclick='find()'>search in deck</button> Enter name of card: <input type='text' id='find_text'>";
	
	var find_input = document.getElementById('find_text');
	
	find_input.addEventListener("keydown", function (e) {
		if (e.keyCode == 13) { //when "Enter" key is pressed
			deck_search(e);
		}})

	function deck_search() {
		
		// check for card in deck
		var find_text = find_input.value;
		let check = DECK.cards.includes(find_text);
		
		if (check == false) {
			document.getElementById('load_text').innerHTML = "Card not found. Note that the search is punctuation and case sensitive.";
		} else if (check == true) {
			display(find_text, 'draw');
			// remove card from deck
			function inDeck (card) {
				return card == find_text
			}
			let i = DECK.cards.findIndex(inDeck);
			DECK.cards.splice(i, 1);
			document.getElementById('load_text').innerHTML = 'Cards remaining: ' + DECK.cards.length;
		}
		document.getElementById("find_div").innerHTML = "<button onclick='find()'>search in deck</button>";
	}
}

async function add() {
	
	document.getElementById("add_div").innerHTML = "<button onclick='add()'>add to deck</button> Enter name of card: <input type='text' id='add_text'>";
	
	var add_input = document.getElementById('add_text');
	
	add_input.addEventListener("keydown", function(e) {
		if (e.keyCode == 13) { // when "Enter" key is pressed
			database_search();
		}})
	
	async function database_search() {
	
		var add_card_unformatted = add_input.value;
		var add_card = URLtext(add_card_unformatted);
		
		var imgURL = await check_in_database();
		
		if (imgURL != undefined) {
			DECK.cards.unshift(add_card_unformatted); // add to top of decklist
			DECK.card_imgs.push([add_card_unformatted, imgURL]) // add to image deck
			document.getElementById('load_text').innerHTML = add_card_unformatted + " successfully placed on top of deck. Shuffle if necessary. Cards remaining: " + DECK.cards.length;
		}
		else {
			document.getElementById('load_text').innerHTML = "Card unknown. Note that the search is punctuation and case sensitive.";
		}
		
		document.getElementById("add_div").innerHTML = "<button onclick='add()'>add to deck</button>";
		
		async function check_in_database(){
			
			document.getElementById('load_text').innerHTML = 'Waiting for Scryfall API ...';
			
			//check for card in database
			let card_url = 'https://api.scryfall.com/cards/named?fuzzy='+add_card+'&format=image';
			let response = await fetch(card_url);
			let imgURL = await response.url;
			
			document.getElementById('load_text').innerHTML = 'Cards remaining: ' + DECK.cards.length;
			
			return imgURL
		}
	}
}

function shuffle() {
	let a = DECK.cards;
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	DECK.cards = a;
	document.getElementById('load_text').innerHTML = "Deck successfully shuffled. Cards remaining: " + DECK.cards.length;
}
