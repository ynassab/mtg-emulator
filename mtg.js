
class Deck {
	constructor() {
		this.cards = []
		this.scry = -1
		this.place = -1
		this.bot_cards = []
	}
}
deck = new Deck()

async function player_ready() {
	
	var decklist = document.getElementById('decklist_box').value;
	decklist = decklist.split("\n");
	fix_decklist();
	//remove all the 1s at the start
	for (var j = 0; j < decklist.length; j++) {
		decklist[j] = decklist[j].substring(2);
	}
	deck.cards = decklist;
	deck.card_imgs = []; // store an array of the images associated with each card
	
	check = await fetch_list(); // check the list to make sure there are no errors
	
	if (check == deck.cards.length) { // called only if fetch_list checks all cards successfully
		document.body.innerHTML = '<br> <body> <div id="draw"></div> <br> <div>		<button onclick="reveal(\'draw\')">draw</button> </div> <br> <div id="scry_btn_div"> <button onclick="reveal(\'scry\')">scry</button> </div> <div id = "scry_btn_buffer"> </div> <br> <div id="find_div"> <button onclick="find()">search in deck</button> </div> <br> <div id="add_div"> <button onclick="add()">add to deck</button> </div> <br> <div> <button onclick="shuffle()">shuffle</button> </div> <br> <div id = "load_text"> <br> </div> <br> <div id="scry"></div>'
		shuffle();
		document.getElementById('load_text').innerHTML = 'Total cards in deck: ' + deck.cards.length;
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
			for (i in deck.cards) {
				let card = deck.cards[i];
				
				document.getElementById('load_text').innerHTML = 'Loading ' + card; // show progress
				
				// check local storage
				var imgURL = localStorage.getItem(card);
				
				if (imgURL == null) { // fetch image from API
					// let proxy_url = 'https://cors-anywhere.herokuapp.com/' // rectifies lack of Access-Control-Allow-Origin header in the response
					let card_url = 'https://api.scryfall.com/cards/named?fuzzy='+card+'&format=image&version=large';
					let response = await fetch(card_url);
					var imgURL = await response.url;
					
					//save to local storage
					localStorage.setItem(card, imgURL);
					
					if (!response.ok) { // if error encounted in fetch
						document.getElementById('load_text').innerHTML = 'Unable to identify the card ' + card + '. Please try again.';
						return null
					}
				}
				
				deck.card_imgs.push([]); // append an element to the array
				deck.card_imgs[i][0] = card; // name
				deck.card_imgs[i][1] = localStorage.getItem(card); // img
				
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
	
	if (type == 'draw') {
		
		let card = deck.cards[0];
		deck.cards.shift(); // remove card from deck
		
		display(card, type);
	
	} else if (type == 'scry') {
		
		document.getElementById('scry_btn_div').innerHTML = '<button onclick="reveal(\'scry\')">scry</button> Place cards in order from left to right.';
		deck.scry += 1;
		let result = deck.cards[deck.scry];
		display(result, type);
		
		if (deck.scry == 0) {
			
			let top_btn = document.createElement('button');
			top_btn.id = 'top_btn';
			top_btn.innerHTML = "place on top";
			top_btn.onclick = place_top;
			
			let bot_btn = document.createElement('button');
			bot_btn.id = 'bot_btn';
			bot_btn.innerHTML = "place on bottom";
			bot_btn.onclick = place_bot;
			
			document.getElementById("scry_btn_buffer").append(top_btn);
			document.getElementById("scry_btn_buffer").append(bot_btn);
		}
	}
}

function display(card, type) {
	
	// find the card image
	for (var i = 0; i < deck.card_imgs.length; i++) {
		if (deck.card_imgs[i][0] == card) { 
			var imgURL = deck.card_imgs[i][1];
		}
	}
	
	card = URLtext(card);
	
	var card_size = 200;
	var num_cards = document.images.length;
	var card_buffer = num_cards * card_size
	
	let img = document.createElement('img');
	img.style = "top:150;left:" + card_buffer.toString(10) + ";width:" + card_size.toString(10);
	img.src = imgURL;
	img.setAttribute('crossorigin', 'anonymous');
	if (type == 'draw') {
		let clock_ = new Date();
		let img_id = clock_.getTime(); // not fool-proof. Find better way to get ID
		img.id = img_id;
		img_id_str = img_id.toString();
		img.setAttribute("onclick", "pop_img(" + img_id_str + ")");
	}
	document.getElementById(type).append(img)
	document.getElementById('load_text').innerHTML = 'Cards remaining: ' + deck.cards.length;
}

function getImageData(img) {
	let canvas = document.createElement("canvas");
	canvas.width = img.width;
	canvas.height = img.height;
	let ctx = canvas.getContext("2d");
	ctx.drawImage(img, 0, 0, img.width, img.height);
	return canvas
}

async function pop_img(img_id) {
	let img = document.getElementById(img_id);
	let canvas = await getImageData(img); // copy to clipboard
	async function waitToCopy() {
		return new Promise((resolve) => {
			canvas.toBlob(blob => navigator.clipboard.write([new ClipboardItem({'image/png': blob})]));
			resolve();
		});
	}
	await waitToCopy();
	img.remove(); // remove img
}

function place_top() {

	deck.place += 1;
	document.getElementById("scry").getElementsByTagName("img")[0].remove();
	
	if (deck.place == deck.scry) {
		stop_scry();
	}
}

function place_bot() {
	
	deck.place += 1;
	deck.bot_cards.push(deck.place); //tag this card position
	document.getElementById("scry").getElementsByTagName("img")[0].remove();
	
	if (deck.place == deck.scry) {
		stop_scry();
	}
}

function stop_scry() {
	deck.scry = -1;
	deck.place = -1;
		
	deck.bot_cards.slice().reverse()
		.forEach(function(i) {
			//loop backwards to avoid index problems
			deck.cards.push(deck.cards[i]) //append card at this position to end of array
			deck.cards.splice(i, 1) //remove card from current position
			});			
	deck.bot_cards = [];
	
	document.getElementById('scry_btn_div').innerHTML = '<button onclick="reveal(\'scry\')">scry</button>';
	document.getElementById('scry_btn_buffer').innerHTML = '';
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
		let check = deck.cards.includes(find_text);
		
		if (check == false) {
			document.getElementById('load_text').innerHTML = "Card not found. Note that the search is punctuation and case sensitive.";
		} else if (check == true) {
			display(find_text, 'draw');
			// remove card from deck
			function inDeck (card) {
				return card == find_text
			}
			let i = deck.cards.findIndex(inDeck);
			deck.cards.splice(i, 1);
			document.getElementById('load_text').innerHTML = 'Cards remaining: ' + deck.cards.length;
		}
		document.getElementById("find_div").innerHTML = "<button onclick='find()'>search in deck</button>";
	}
}

async function add() {
	
	document.getElementById("add_div").innerHTML = "<button onclick='add()'>add to deck</button> Enter name of card: <input type='text' id='add_text'>";
	
	var add_input = document.getElementById('add_text');
	
	add_input.addEventListener("keydown", function(e) {
		if (e.keyCode == 13) { //when "Enter" key is pressed
			database_search();
		}})
	
	async function database_search() {
	
		var add_card_unformatted = add_input.value;
		var add_card = URLtext(add_card_unformatted);
		
		var imgURL = await check_in_database();
		
		if (imgURL != undefined) {
			deck.cards.unshift(add_card_unformatted); // add to top of decklist
			deck.card_imgs.push([add_card_unformatted, imgURL]) // add to image deck
			document.getElementById('load_text').innerHTML = add_card_unformatted + " successfully placed on top of deck. Shuffle if necessary. Cards remaining: " + deck.cards.length;
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
			
			document.getElementById('load_text').innerHTML = 'Cards remaining: ' + deck.cards.length;
			
			return imgURL
		}
	}
}

function shuffle() {
	let a = deck.cards;
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	deck.cards = a;
	document.getElementById('load_text').innerHTML = "Deck successfully shuffled. Cards remaining: " + deck.cards.length;
}
