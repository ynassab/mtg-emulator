
class Deck {
	constructor() {
		this.cards = []
	}
}

const DECK = new Deck()
const CARD_SIZE = 244;
const BUFFER = 'height:'+CARD_SIZE*1.395+';width:'+CARD_SIZE;
const BUTTONS_WIDTH = 260;
const CARDS_WIDTH = window.innerWidth - BUTTONS_WIDTH - 18;

async function player_ready() {
	
	var decklist = document.getElementById('decklist_box').value;
	decklist = decklist.split("\n"); // make a list with values separated by new-line character
	remove_spaces(); // remove empty lines
	fix_decklist(); // enumerate list elements
	for (var j = 0; j < decklist.length; j++) { // remove all the 1s at the start
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
							<button onclick="reveal(null,\'draw\')">draw</button>
						</div>
						<br>
						<div id="scry_btn_div">
							<button onclick="reveal(null,\'scry\')">scry</button><br>
							<div id='scry_explain'>
							</div>
						</div>
						<br>
						<div id="find_div">
							<button onclick="find()">search in deck</button><br>
							<div id='find_div_explain'>
							</div>
						</div>
						<br>
						<div id="add_div">
							<button onclick="add()">add to deck</button><br>
							<div id='add_div_explain'>
							</div>
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
				button { background-color: #489003;
						color: white;
						font: bold 20px Georgia, serif;
				}
						
			</style>`
		shuffle();
		document.getElementById('load_text').innerHTML = 'Click on card images to copy to clipboard. <br> <br> Total cards in deck: ' + DECK.cards.length;
	}
	
	function remove_spaces() { // remove empty lines in decklist
		for (var i = 0; i < decklist.length; i++) {
			if (decklist[i] == '') {
				decklist.splice(i, 1);
				remove_spaces(); // restart at i = 0 if space removed
			}
		}
	}
	
	function fix_decklist() {
		try {
			// check the first character of every string and add a new element if it's >1
			for (var i = 0; i < decklist.length; i++) {
				var element = decklist[i];
				var count = element.match(/\d+/)[0]; // extract number at start
				if (count > 1)  {
					var temp_element = element.replace(count, "1");
					decklist.push(temp_element);
					decklist[i] = element.replace(count, count-1); // reduce the count of the card in its original place
					if (count == 1) {
						decklist.splice(i, 1); // remove card from place
					} else {
						fix_decklist(); // repeat if necessary
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
				var card = DECK.cards[i];
				
				document.getElementById('load_text').innerHTML = 'Loading ' + card; // show progress
				
				var imgURL = localStorage.getItem(card); // check local storage
				
				if (imgURL == null) { // fetch image from API
					var response = await fetch('https://api.scryfall.com/cards/named?fuzzy='+card+'&format=image&version=normal');
					var imgURL = await response.url;
					localStorage.setItem(card, imgURL); //save to local storage
					if (!response.ok) { // if error encounted in fetch
						document.getElementById('load_text').innerHTML = 'Unable to identify the card ' + card + '. Please try again.';
						return null
					}
				}
				
				DECK.card_imgs.push([]); // append element to the array
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


function URLtext(card_name) { // replace characters for URL
	card_name = card_name.replace(/,/g, '');
	card_name = card_name.replace(/'/g, '');
	card_name = card_name.replace(/-/g, '');
	card_name = card_name.replace(/ /g, '+');
	return card_name;
}

function reveal(card, type) {
	
	if (card==null) { // reveal top card if not specified
		var card = DECK.cards[0];
		DECK.cards.shift(); // remove card from deck
	}

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
		document.getElementById('buffer').style = ''; // keep draw div height constant between empty and non-empty hand
		img.setAttribute("onclick", "pop_img("+img_id_str+")");
	}
	else if (type == 'scry') {
		document.getElementById('scry_explain').innerHTML = 'Left-click to place on top. <br> Right-click to place on bottom. <br><br> You may need to scroll down to see scried cards. <br>'
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
		document.getElementById('scry_explain').innerHTML = '';
	}
	document.getElementById('load_text').innerHTML = 'Cards remaining: ' + DECK.cards.length; // update card count
}

function find() {
	
	append_explain_text('find');
	
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
			reveal(find_text, 'draw');
			// remove card from deck
			function inDeck (card) {
				return card == find_text
			}
			let i = DECK.cards.findIndex(inDeck);
			DECK.cards.splice(i, 1);
			document.getElementById('load_text').innerHTML = 'Cards remaining: ' + DECK.cards.length;
		}
		document.getElementById("find_div_explain").innerHTML = '';
	}
}

async function add() {
	
	append_explain_text('add');	
	
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
			document.getElementById('load_text').innerHTML = add_card_unformatted + " successfully placed on top of deck. <br> Shuffle if necessary. <br> Cards remaining: " + DECK.cards.length;
		}
		else {
			document.getElementById('load_text').innerHTML = "Card unknown. Note that the search is punctuation and case sensitive.";
		}
		
		document.getElementById("add_div_explain").innerHTML = '';
		
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

function append_explain_text(type) {
	div = document.getElementById(type+"_div_explain")
	div.innerHTML = "Enter name of card: <input type='text' id='"+type+"_text'>";
	if (div.getElementsByTagName('button').length == 0) { // add button if none exist already
		cancel = document.createElement("button");
		cancel.innerHTML = "Cancel";
		cancel.id = type+"_cancel";
		cancel.onclick = function (e) {
			document.getElementById(type+"_div_explain").innerHTML = '';
			document.getElementById(type+"_cancel").remove();
		}
		div.innerHTML += "<br>";
		div.appendChild(cancel);
	}
}

function shuffle() {
	let a = DECK.cards;
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	DECK.cards = a;
	document.getElementById('load_text').innerHTML = "Deck successfully shuffled. <br> Cards remaining: " + DECK.cards.length;
}
