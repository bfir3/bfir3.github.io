'use strict';
let _data;
let _armorData;
let _breedData;
let _weaponData;
let _heroData;
let _properties;
let buildId;
let db;
let builds;
let buildSetId;
let currentUser;
let MAX_SCALED_POWER_LEVEL = 565.625;
let DEFAULT_BOOST_CURVE_COEFFICIENT = 1;
let DEFAULT_CRIT_BOOST = 0.5;
let DEFAULT_HEADSHOT_BOOST = 0.5;
let weaponPageInitialized = false;

const DB_NAME = "verminBuildSets";

function getUniqueIdentifier() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  }).split('-')[4];
}

function createNewLoadout() {
	let newBuildId = getUniqueIdentifier();
	
	$(".loadoutSelection").append(new Option("New Build", newBuildId));	
	window.location.hash = getBuildSetId() + '-' + newBuildId;
	$(".footer>input").val('http://verminbuilds.com/#' + getBuildSetId() + "-" + newBuildId);
	
	$(".loadoutSelection")[0].selectedIndex = $(".loadoutSelection")[0].options.length - 1;
	clearSelections();
}

function updateLoadoutSelection() {
	let buildName = !$(".buildName").val() || $(".buildName").val().length == 0 ? "Untitled Build" : $(".buildName").val();	
	
	if ($(".loadoutSelection")[0].selectedIndex == -1) {	
		return;
	}
	$(".loadoutSelection")[0].options[$(".loadoutSelection")[0].selectedIndex].text = buildName;
}

function loadLoadouts(force) {
	if ($(".loadoutSelection")[0].options.length > 0 && !force) {
		return;
	}
	
	db.collection("buildTable").where("buildSetId", "==", getBuildSetId()).get().then((queryRef) => {
		$(".loadoutSelection").empty()
		if (queryRef.size > 1) {
			$(".mainGrid").addClass('buildCollection');
		}
		
		queryRef.forEach((doc) => {
			$(".loadoutSelection").append(new Option(doc.data().name, doc.id));
		});
		if (window.location.hash.split('-')[1] && window.location.hash.split('-')[1].length > 0) {
			$(".loadoutSelection")[0].value = window.location.hash.split('-')[1];	
		}
	});
}

function clearSelections() {
	$(".buildName").val('');
	$(".buildDescription").val('');
	$(".relatedVideo").val('');
	$(".talentSection>div>div").removeClass('selected');
	$("iframe").hide();
	
	let heroIndex = getHeroIndex();
	let careerIndex = getCareerIndex();
	
	loadMeleeWeapons(heroIndex,careerIndex);
	loadRangeWeapons(heroIndex,careerIndex);
	loadProperties("necklace", _data.necklace_properties);
	loadProperties("charm", _data.charm_properties);
	loadProperties("trinket", _data.trinket_properties);
}

function getBuildId() {	
	let buildId = window.location.hash.length > 0 ? window.location.hash.substring(1).split('-')[1] : "";
	if (buildId.length > 0) {
		return buildId;
	}
	buildId =  getUniqueIdentifier()
	window.location.hash = getBuildSetId() + '-' + buildId;
	
	let buildName = !$(".buildName").val() || $(".buildName").val().length == 0 ? "Untitled Build" : $(".buildName").val();	
	$(".loadoutSelection").append(new Option(buildName, buildId));
	
	return buildId;

	if ($(".loadoutSelection")[0].options.length > 0) {
		return $(".loadoutSelection")[0].options[$(".loadoutSelection")[0].selectedIndex].value;
	}
	
	buildId = getUniqueIdentifier();
	window.location.hash = getBuildSetId() + '-' + buildId;
	
	return buildId;
}

function getBuildSetId() {
	let buildSetId = window.location.hash.length > 0 ? window.location.hash.substring(1).split('-')[0] : "";
	if (buildSetId.length > 0) {
		return buildSetId;
	}
	buildSetId = getUniqueIdentifier()
	window.location.hash = buildSetId;
	return buildSetId;
	
	return window.location.hash.substring(1).split('-')[0];
	
	if (!buildSetId || buildSetId.length == 0) {
		buildSetId = getUniqueIdentifier();
		window.location.hash = buildSetId;
	}
	return buildSetId;
}

function cloneBuild() {
	let buildName = $(".buildName").val();	
	let buildDescription = $(".buildDescription").val();	
	let clonedBuildSetId = getUniqueIdentifier();
	let clonedBuildId = getUniqueIdentifier();
	
	let docRef = db.collection("buildTable").doc(clonedBuildId);
	
	let author = getCurrentUser() ? getCurrentUser().displayName : "";
	let authorEmail = getCurrentUser() ? getCurrentUser().email : "";
	
	docRef.set({
		buildSetId:clonedBuildSetId,
		author: author,
		authorEmail: authorEmail,
		name: buildName,
		description: buildDescription,
		hash: getSerializedUrl(),
		videoLink: $(".relatedVideo").val()
	}, { merge: true }).then(function (ref) {
		console.log("build cloned successfully");
		window.location.hash = `${clonedBuildSetId}-${clonedBuildId}`;
		loadLoadouts(true);
		$(".mainGrid").removeClass('locked');
		$(".buildDescription")[0].disabled = false;
	});
}

function cloneBuildSet() {
	let promises = [];
	let clonedBuildSetId = getUniqueIdentifier();
	db.collection("buildTable").where("buildSetId", "==", getBuildSetId()).get().then((queryRef) => {
		queryRef.forEach((build) => {
			let clonedBuildId = getUniqueIdentifier();		
			
			let docRef = db.collection("buildTable").doc(clonedBuildId);
			
			let buildName = build.data().name;	
			let buildDescription = build.data().description;		
			let author = getCurrentUser() ? getCurrentUser().displayName : "";
			let authorEmail = getCurrentUser() ? getCurrentUser().email : "";
			
			promises.push(docRef.set({
				buildSetId:clonedBuildSetId,
				author: author,
				authorEmail: authorEmail,
				name: buildName,
				description: buildDescription,
				hash: build.data().hash,
				videoLink: build.data().videoLink
			}, { merge: true }).then(function (ref) {
				console.log("build set cloned successfully");
				window.location.hash = `${clonedBuildSetId}-${clonedBuildId}`;
				$(".mainGrid").removeClass('locked');
				$(".buildDescription")[0].disabled = false;
			}));
		});
		
		Promise.all(promises).then(() => {
			loadLoadouts(true);
		});
	});
}

function updateBuild() {	
	if ($(".mainGrid").hasClass('locked')) {
		return;
	}
	let buildName = $(".buildName").val();	
	let buildDescription = $(".buildDescription").val();	
	
	let docRef = db.collection("buildTable").doc(getBuildId());
	
	let author = getCurrentUser() ? getCurrentUser().displayName : "";
	let authorEmail = getCurrentUser() ? getCurrentUser().email : "";
	
	docRef.set({
		buildSetId:getBuildSetId(),
		author: author,
		authorEmail: authorEmail,
		name: buildName,
		description: buildDescription,
		hash: getSerializedUrl(),
		videoLink: $(".relatedVideo").val()
	}, { merge: true }).then(function (ref) {
		// successfully added data
	});
}

function isViewCookieExpired(buildCookie) {
	return (new Date() - new Date(buildCookie)) > (60 * 60 * 1000);
}

function updatePageViews(buildSetId, buildId) {
		
	let buildCookie = localStorage.getItem(`${buildSetId}-${buildId}`);
	
	if (!buildCookie || isViewCookieExpired(buildCookie)) {
		let docRef = db.collection("buildTable").doc(buildId);
		docRef.get().then((doc) => {
			if (!doc.data()) {
				return;
			}
			let views = !doc.data().pageViews || doc.data().pageViews.length == 0 || doc.data().pageViews == 0 ? 1 : doc.data().pageViews + 1;
				
			docRef.set({
				pageViews: views
			}, { merge: true }).then(function (ref) {
				// successfully added data
				console.log("page view data added");
			});
				
		});
		localStorage.setItem(`${buildSetId}-${buildId}`, new Date());
	}
}

function loadBuild() {
	let hash = window.location.hash.substring(1);
	if (!hash || hash.length == 0) {	
		return;
	}
	
	if (hash.indexOf("hero=") >= 0) {
		loadSerializedUrl(hash);
		return;
	}
	
	if (hash.split('-').length == 2) {		
		buildSetId = hash.split('-')[0];
		let buildChildId = hash.split('-')[1];
		
		updatePageViews(buildSetId, buildChildId);
		let buildRef = db.collection("buildTable").doc(buildChildId);
		
		buildRef.get().then((doc) => {
			if (!doc.data()) {
				console.log("Unable to load build");
				return;
			}
			
			let authorEmail = doc.data().authorEmail;
			
			if (getCurrentUser() && getCurrentUser().email == authorEmail) {
				$(".mainGrid").addClass("editable");
			}
			
			if (doc.data().author && doc.data().author.length > 0) {
				$(".authorLabel").html(`Created By: ${doc.data().author}`);
				$(".buildSummaryBar").removeClass('hide');
			}
			else {
				$(".authorLabel").html('');
				$(".buildSummaryBar").addClass('hide');
			}
			$(".buildName").val(doc.data().name);
			$(".buildDescription").val(doc.data().description);
			$(".relatedVideo").val(doc.data().videoLink);
			if (doc.data().videoLink.length > 0) {
				loadVideoPlayer(doc.data().videoLink);
			}
			loadSerializedUrl(doc.data().hash);
			$(".spinner").hide();
			$(".mainGrid").removeClass('loading');
			$(".mainGrid").show();
			$(".buildBrowserSection").hide();
		});
		return;
	}
		
	buildSetId = hash;
	db.collection("buildTable").where("buildSetId", "==", buildSetId).get().then((queryRef) => {
		let buildList = [];
		queryRef.forEach((doc) => {
			buildList.push(doc);
		});
		
		let doc = buildList[0];
		let author = doc.data().author;
		
		if (getCurrentUser() && getCurrentUser().email == author) {
			$(".mainGrid").addClass("editable");
		}
		
		$(".buildName").val(doc.data().name);
		$(".buildDescription").val(doc.data().description);
		$(".relatedVideo").val(doc.data().videoLink);
		if (doc.data().videoLink.length > 0) {
			loadVideoPlayer(doc.data().videoLink);
		}
		loadSerializedUrl(doc.data().hash);
		$(".spinner").hide();
		$(".mainGrid").removeClass('loading');
		$(".mainGrid").show();
		$(".buildBrowserSection").hide();
	});
}

function loadCareerBuild(buildSetId, buildId) {
	// return build from db based on ids
}

function getHashValue(hash, keyString) {
	return hash.split('&').filter((item) => { return item.includes(keyString); })[0].replace(`${keyString}=`,"");
}

function loadProperties(propertyName, propertyCollection) {

	$(`.${propertyName}Property1Selection`).html('');
	$(`.${propertyName}Property2Selection`).html('');
	let i = 0;
	for (let propertyRef of propertyCollection) {
		$(`.${propertyName}Property1Selection`).append(new Option(propertyRef.name, i));
		if (i == 1) {
			$(`.${propertyName}Property2Selection`).append(new Option(propertyRef.name, i++, true, true));
		}
		else {
			$(`.${propertyName}Property2Selection`).append(new Option(propertyRef.name, i++));
		}
	}
	
	let property1Text = $(`.${propertyName}Property1Selection`)[0].options[$(`.${propertyName}Property1Selection`)[0].selectedIndex].text
	let property2Text = $(`.${propertyName}Property2Selection`)[0].options[$(`.${propertyName}Property2Selection`)[0].selectedIndex].text
	
	let property1 = propertyCollection.filter(function (item) { return item.name.includes(property1Text); })[0];
	let property2 = propertyCollection.filter(function (item) { return item.name.includes(property2Text); })[0];
	
	$(`input[name='${propertyName}Property1']`).attr({ 
		"min": property1.min_value,
		"max": property1.max_value,
		"value": property1.max_value,
		"step": property1.step
	});
	
	$(`input[name='${propertyName}Property2']`).attr({ 
		"min": property2.min_value,
		"max": property2.max_value,
		"value": property2.max_value,
		"step": property2.step
	});
}

function loadSerializedUrl(hash) {
	let heroHashValue = getHashValue(hash, "hero")
	let meleeHashValue = getHashValue(hash, "melee")
	let rangeHashValue = getHashValue(hash, "range")
	let necklaceHashValue = getHashValue(hash, "necklace")
	let charmHashValue = getHashValue(hash, "charm")
	let trinketHashValue = getHashValue(hash, "trinket")
	let talentsHashValue = getHashValue(hash, "talents")
	
	let heroIndex = heroHashValue[0];
	let careerIndex = heroHashValue[1];
	
	$(".heroSection>div").removeClass('selected');
	$(".heroSection>div").removeClass('redBorder');
	$($(".heroSection").children()[heroIndex]).addClass('selected redBorder');
	$(".classSection>div").removeClass('selected');
	$(".classSection>div").removeClass('redBorder');
	$($(".classSection").children()[careerIndex]).addClass('selected redBorder');
	
	loadHero(heroIndex, careerIndex);	
	loadSerializedWeapon("melee", meleeHashValue);
	loadSerializedWeapon("range", rangeHashValue);
	loadSerializedGear("necklace", necklaceHashValue);
	loadSerializedGear("charm", charmHashValue);
	loadSerializedGear("trinket", trinketHashValue);
	loadTalents(talentsHashValue);
	loadTraits();
	loadLoadouts();
	loadHeroSummary();
}

function loadHeroSummary() {
	let heroIndex = getHeroIndex();
	let careerIndex = getCareerIndex();
	$(".heroClass1").css('background-image',  `url('images/icons/heroes/${heroIndex}/0/icon.png')`);
	$(".heroClass2").css('background-image',  `url('images/icons/heroes/${heroIndex}/1/icon.png')`);
	$(".heroClass3").css('background-image',  `url('images/icons/heroes/${heroIndex}/2/icon.png')`);
	
	$(".heroSummaryTitle>span")[0].innerHTML = `<span>${_data.heroes[heroIndex].name} - ${_data.heroes[heroIndex].careers[careerIndex].name}</span>`;
	
	$(".heroPortrait").css('background', `url('images/icons/heroes/${heroIndex}/${careerIndex}/portrait.png')`);
	$("#healthValue").html(`${_data.heroes[heroIndex].careers[careerIndex].health}`);
	$("#cooldownValue").html(`${_data.heroes[heroIndex].careers[careerIndex].skill.cooldown} seconds`);
}

function loadAbilities(heroIndex, careerIndex) {
	$(".heroActiveAbility").html('');
	$(".heroPassiveAbility").html('');
	
	let skillName = _data.heroes[heroIndex].careers[careerIndex].skill.name;
	let skillDescription = _data.heroes[heroIndex].careers[careerIndex].skill.description;
	$(".heroActiveAbility").append(`<span>${skillName}</span><span>${skillDescription}</span>`);
	
	for (let ability of _data.heroes[heroIndex].careers[careerIndex].passives) {
		$(".heroPassiveAbility").append(`<span>${ability.name}</span><span>${ability.description}</span>`);
	}
}

function loadSerializedWeapon(weaponName, serializedString) {
	let params = serializedString.split(';');
	let id = params[0].split(':')[1];
	let qualityId = params[1].split(':')[1];
	let power = params[2].split(':')[1];
	let property1Id = params[3].split(':')[1];
	let property1Value = params[4].split(':')[1];
	let property2Id = params[5].split(':')[1];
	let property2Value = params[6].split(':')[1];
	let traitId = params[7].split(':')[1];
	
	if (weaponName == "melee" || weaponName == "range") {
		$(`.${weaponName}Selection`)[0].selectedIndex = id;
	}
	
	$(`.${weaponName}QualitySelection`)[0].selectedIndex = qualityId;
	$(`.${weaponName}Property1Selection`)[0].selectedIndex = property1Id;
	$(`.${weaponName}Property2Selection`)[0].selectedIndex = property2Id;
	$(`.${weaponName}TraitSelection`)[0].selectedIndex = traitId;
	$(`input[name="${weaponName}PowerLevel"]`)[0].value = power;
	$(`input[name="${weaponName}Property1"]`)[0].value = property1Value;
	$(`input[name="${weaponName}Property2"]`)[0].value = property2Value;
}

function loadSerializedGear(gearName, serializedString) {
	let params = serializedString.split(';');
	let qualityId = params[0].split(':')[1];
	let power = params[1].split(':')[1];
	let property1Id = params[2].split(':')[1];
	let property1Value = params[3].split(':')[1];
	let property2Id = params[4].split(':')[1];
	let property2Value = params[5].split(':')[1];
	let traitId = params[6].split(':')[1];
	
	$(`.${gearName}QualitySelection`)[0].selectedIndex = qualityId;
	$(`.${gearName}Property1Selection`)[0].selectedIndex = property1Id;
	$(`.${gearName}Property2Selection`)[0].selectedIndex = property2Id;
	$(`.${gearName}TraitSelection`)[0].selectedIndex = traitId;
	$(`input[name="${gearName}PowerLevel"]`)[0].value = power;
	$(`input[name="${gearName}Property1"]`)[0].value = property1Value;
	$(`input[name="${gearName}Property2"]`)[0].value = property2Value;
}

function loadTalents(serializedString) {
	$(".talentSection>div>div").removeClass('selected');
	
	for (let i = 0; i < 5; i++) {
		if (serializedString[i] > 2) {
			continue;
		}
		$($($(".talentSection>div")[i]).children()[serializedString[i]]).addClass('selected redBorder');
	}
}

function loadHero(heroIndex, careerIndex) {
	let career = _data.heroes[heroIndex].careers[careerIndex];
	let talents = career.talents;
	
	let i = 0;
	let y = 0;
	for (let tier of talents) {
			for (let talent of tier) {
				$(".talentSection>.tier" + i + ">.talent" + y + " .talentIcon").css('background', `url('images/icons/heroes/${heroIndex}/${careerIndex}/talents/${i}/${y}.png')`);
				$(".talentSection>.tier" + i + ">.talent" + y + " .talentName")[0].innerHTML = talent.name;
				$(".talentSection>.tier" + i + ">.talent" + y + " .talentDescription")[0].innerHTML = talent.description;
				y++;
			}
			y = 0;
			i++;
	}
	loadCareers(heroIndex, careerIndex);
	loadAbilities(heroIndex, careerIndex);
}

function loadCareers(heroIndex, careerIndex) {
	let heroCareers = $(".classSection").children();
	let i = 0;
	if (!careerIndex){
		careerIndex = 0;
	}
	for (let career of _data.heroes[heroIndex].careers) {
		if(careerIndex == i) {
			heroCareers[i].classList.add("selected");
			heroCareers[i].classList.add("redBorder");
		}
		else {
			heroCareers[i].classList.remove("selected");
			heroCareers[i].classList.remove("redBorder");
		}
	}
	loadMeleeWeapons(heroIndex,careerIndex);
	loadRangeWeapons(heroIndex,careerIndex);
	loadProperties("necklace", _data.necklace_properties);
	loadProperties("charm", _data.charm_properties);
	loadProperties("trinket", _data.trinket_properties);
	reloadRangeTraits();
}

function reloadRangeTraits() {
	let i = 0;
	$(".rangeTraitSelection").html('');
	if (getHeroIndex() == 1 && getCareerIndex() == 2) {
		for (let meleeTrait of _data.melee_traits) {
			$(".rangeTraitSelection").append(new Option(meleeTrait.name, i++));
		}
		return;
	}	
	i = 0;
	for (let rangeTrait of _data.range_traits) {
		$(".rangeTraitSelection").append(new Option(rangeTrait.name, i++));
	}
}

function loadMeleeWeapons(heroIndex, careerIndex) {
	$(".meleeSelection")[0].innerHTML = '';
	
	let heroCareer = _data.heroes[heroIndex].careers[careerIndex];		
	let meleeWeapons = _data.melee_weapons.filter(function (item) { return item.class.includes(heroCareer.name); })
	let i = 0;
		
	for (let meleeWeapon of meleeWeapons) {
		$(".meleeSelection").append(new Option(meleeWeapon.name, i++));
	}
	loadProperties("melee", _data.melee_properties);
}

function loadRangeWeapons(heroIndex, careerIndex) {
	$(".rangeSelection")[0].innerHTML = '';
	
	
	let heroCareer = _data.heroes[heroIndex].careers[careerIndex];		
	let rangeWeapons = heroIndex == 1 && careerIndex == 2 ? _data.melee_weapons.filter(function (item) { return item.class.includes(heroCareer.name); }) : _data.range_weapons.filter(function (item) { return item.class.includes(heroCareer.name); })
	let i = 0;
		
	for (let rangeWeapon of rangeWeapons) {
		$(".rangeSelection").append(new Option(rangeWeapon.name, i++));
	}
	heroIndex == 1 && careerIndex == 2 ? loadProperties("range", _data.melee_properties) : loadProperties("range", _data.range_properties);
}

function loadTraits() {
	let meleeTrait = $(".meleeTraitSelection")[0].options[$(".meleeTraitSelection")[0].selectedIndex].value
	$(".meleeWeaponSection>.traitDescription")[0].innerHTML = "<span>" + _data.melee_traits[meleeTrait].description + "</span>";
	
	let rangeTrait = $(".rangeTraitSelection")[0].options[$(".rangeTraitSelection")[0].selectedIndex].value
	if (getHeroIndex() == 1 && getCareerIndex() == 2) {		
		$(".rangeWeaponSection>.traitDescription")[0].innerHTML = "<span>" + _data.melee_traits[rangeTrait].description + "</span>";
	}
	else {
		$(".rangeWeaponSection>.traitDescription")[0].innerHTML = "<span>" + _data.range_traits[rangeTrait].description + "</span>";
	}
	
	let necklaceTrait = $(".necklaceTraitSelection")[0].options[$(".necklaceTraitSelection")[0].selectedIndex].value
	$(".necklaceSection>.traitDescription")[0].innerHTML = "<span>" + _data.necklace_traits[necklaceTrait].description + "</span>";
	
	let charmTrait = $(".charmTraitSelection")[0].options[$(".charmTraitSelection")[0].selectedIndex].value
	$(".charmSection>.traitDescription")[0].innerHTML = "<span>" + _data.charm_traits[charmTrait].description + "</span>";
	
	let trinketTrait = $(".trinketTraitSelection")[0].options[$(".trinketTraitSelection")[0].selectedIndex].value
	$(".trinketSection>.traitDescription")[0].innerHTML = "<span>" + _data.trinket_traits[trinketTrait].description + "</span>";
}

function getSerializedHero() {
	return 'hero=' + getHeroIndex() + getCareerIndex() + '';
}

function getSerializedWeapon(weapon) {
	let id = $("." + weapon + "Selection")[0].options[$("." + weapon + "Selection")[0].selectedIndex].value;
	let quality = $("." + weapon + "QualitySelection")[0].options[$("." + weapon + "QualitySelection")[0].selectedIndex].value;
	let heroPower = $('input[name="' + weapon + 'PowerLevel"]')[0].value;
	let property1Id = $("." + weapon + "Property1Selection")[0].options[$("." + weapon + "Property1Selection")[0].selectedIndex].value;
	let property1Value =  $('input[name="' + weapon + 'Property1"]')[0].value;
	let property2Id = $("." + weapon + "Property2Selection")[0].options[$("." + weapon + "Property2Selection")[0].selectedIndex].value;
	let property2Value = $('input[name="' + weapon + 'Property2"]')[0].value;
	let traitId = $("." + weapon + "TraitSelection")[0].options[$("." + weapon + "TraitSelection")[0].selectedIndex].value;
	
	let serializedString = `${weapon}=id:${id};q:${quality};hp:${heroPower};p1:${property1Id};v1:${property1Value};p2:${property2Id};v2:${property2Value};t:${traitId};`;
	return serializedString;
}

function getSerializedGear(item) {
	let quality = $("." + item + "QualitySelection")[0].options[$("." + item + "QualitySelection")[0].selectedIndex].value;
	let heroPower = $('input[name="' + item + 'PowerLevel"]')[0].value;
	let property1Id = $("." + item + "Property1Selection")[0].options[$("." + item + "Property1Selection")[0].selectedIndex].value;
	let property1Value =  $('input[name="' + item + 'Property1"]')[0].value;
	let property2Id = $("." + item + "Property2Selection")[0].options[$("." + item + "Property2Selection")[0].selectedIndex].value;
	let property2Value = $('input[name="' + item + 'Property2"]')[0].value;
	let traitId = $("." + item + "TraitSelection")[0].options[$("." + item + "TraitSelection")[0].selectedIndex].value;
	
	let serializedString = `${item}=q:${quality};hp:${heroPower};p1:${property1Id};v1:${property1Value};p2:${property2Id};v2:${property2Value};t:${traitId};`;
	return serializedString;
}

function getSerializedTalents() {
	let serializedString = "talents=";
	for (let i = 0; i < $(".talentSection").children().length; i++) {
		let y = 0;
		for (y = 0; y < $($(".talentSection").children()[i]).children().length; y++) {
			if ($($(".talentSection").children()[i]).children()[y].classList.contains('selected')) {
				serializedString += y;
				break;
			}
		}
		if (y == $($(".talentSection").children()[i]).children().length) {
			serializedString += "9";
		}
	}
	return serializedString;
}

function getSerializedUrl() {
	return getSerializedHero() + '&' + getSerializedWeapon("melee") + '&' + getSerializedWeapon("range") + '&' + getSerializedGear("necklace") + '&' + getSerializedGear("charm") + '&' + getSerializedGear("trinket") + '&' + getSerializedTalents()
}

function getShareableUrl() {	
	return 'http://verminbuilds.com/#' + getBuildId();
}

function getHeroIndex() {
	return Array.prototype.indexOf.call($(".heroSection").children(),$(".heroSection>div.selected")[0]);
}
function getCareerIndex() {
	return Array.prototype.indexOf.call($(".classSection").children(),$(".classSection>div.selected")[0]);
}

function initData() {
	initFirestore();
	let i = 0;
	/*
	for (let meleeWeapon of _data.melee_weapons) {
		$(".meleeSelection").append(new Option(meleeWeapon.name, i++));
	}
	
	i = 0;
	for (let rangeWeapon of _data.range_weapons) {
		$(".rangeSelection").append(new Option(rangeWeapon.name, i++));
	*/
	
	i = 0;
	for (let meleeTrait of _data.melee_traits) {
		$(".meleeTraitSelection").append(new Option(meleeTrait.name, i++));
	}
	
	i = 0;
	for (let rangeTrait of _data.range_traits) {
		$(".rangeTraitSelection").append(new Option(rangeTrait.name, i++));
	}
	
	i = 0;
	for (let meleeProperty of _data.melee_properties) {
		$(".meleeProperty1Selection").append(new Option(meleeProperty.name, i));
		if (i == 1) {
			$(".meleeProperty2Selection").append(new Option(meleeProperty.name, i++, true, true));
		}
		else {
			$(".meleeProperty2Selection").append(new Option(meleeProperty.name, i++));
		}
	}
	
	i = 0;
	for (let rangeProperty of _data.range_properties) {
		$(".rangeProperty1Selection").append(new Option(rangeProperty.name, i));
		if (i == 1) {
			$(".rangeProperty2Selection").append(new Option(rangeProperty.name, i++, true, true));
		}
		else {
			$(".rangeProperty2Selection").append(new Option(rangeProperty.name, i++));
		}
	}
	
	i = 0;
	for (let necklaceTrait of _data.necklace_traits) {
		$(".necklaceTraitSelection").append(new Option(necklaceTrait.name, i++));
	}
	
	i = 0;
	for (let charmTrait of _data.charm_traits) {
		$(".charmTraitSelection").append(new Option(charmTrait.name, i++));
	}
	
	i = 0;
	for (let trinketTrait of _data.trinket_traits) {
		$(".trinketTraitSelection").append(new Option(trinketTrait.name, i++));
	}
	
	i = 0;
	for (let necklaceProperty of _data.necklace_properties) {
		$(".necklaceProperty1Selection").append(new Option(necklaceProperty.name, i));
		if (i == 1) {
		$(".necklaceProperty2Selection").append(new Option(necklaceProperty.name, i++, true, true));
		}
		else {
		$(".necklaceProperty2Selection").append(new Option(necklaceProperty.name, i++));
		}
	}
	
	i = 0;
	for (let charmProperty of _data.charm_properties) {
		$(".charmProperty1Selection").append(new Option(charmProperty.name, i));
		if (i == 1) {
		$(".charmProperty2Selection").append(new Option(charmProperty.name, i++));
		}
		else {
		$(".charmProperty2Selection").append(new Option(charmProperty.name, i++, true, true));
		}
	}
	
	i = 0;
	for (let trinketProperty of _data.trinket_properties) {
		$(".trinketProperty1Selection").append(new Option(trinketProperty.name, i));
		if (i == 1) {
		$(".trinketProperty2Selection").append(new Option(trinketProperty.name, i++, true, true));
		}
		else {
		$(".trinketProperty2Selection").append(new Option(trinketProperty.name, i++, true, true));
		}
	}
	
	$(".meleeQualitySelection").append(new Option("Red", 0));
	$(".meleeQualitySelection").append(new Option("Orange", 1, true, true));
	$(".meleeQualitySelection").append(new Option("Blue", 2));
	$(".meleeQualitySelection").append(new Option("Green", 3));
	$(".meleeQualitySelection").append(new Option("White", 4));
	
	$(".rangeQualitySelection").append(new Option("Red", 0));
	$(".rangeQualitySelection").append(new Option("Orange", 1, true, true));
	$(".rangeQualitySelection").append(new Option("Blue", 2));
	$(".rangeQualitySelection").append(new Option("Green", 3));
	$(".rangeQualitySelection").append(new Option("White", 4));
	
	$(".necklaceQualitySelection").append(new Option("Red", 0));
	$(".necklaceQualitySelection").append(new Option("Orange", 1, true, true));
	$(".necklaceQualitySelection").append(new Option("Blue", 2));
	$(".necklaceQualitySelection").append(new Option("Green", 3));
	$(".necklaceQualitySelection").append(new Option("White", 4));
	
	$(".charmQualitySelection").append(new Option("Red", 0));
	$(".charmQualitySelection").append(new Option("Orange", 1, true, true));
	$(".charmQualitySelection").append(new Option("Blue", 2));
	$(".charmQualitySelection").append(new Option("Green", 3));
	$(".charmQualitySelection").append(new Option("White", 4));
	
	$(".trinketQualitySelection").append(new Option("Red", 0));
	$(".trinketQualitySelection").append(new Option("Orange", 1, true, true));
	$(".trinketQualitySelection").append(new Option("Blue", 2));
	$(".trinketQualitySelection").append(new Option("Green", 3));
	$(".trinketQualitySelection").append(new Option("White", 4));
	
	if (window.location.hash) {
		let hash = window.location.hash.substring(1);
		
		if (hash == "myBuilds") {
			$(".page").hide();
			loadMyBuilds();
			return;
		}
		
		if (hash == "buildBrowser") {
			$(".mainGrid").hide();
			return;
		}
		
		if (hash == "weapons") {
			$(".page").hide();
			$(".spinner").show();
			return;
		}
		
		loadBuild();
		return;
	}
	
	loadHero(0,0);
	loadHeroSummary(0, 0);
		
	loadProperties("melee", _data.melee_properties);	
	getHeroIndex() == 1 && getCareerIndex() == 2 ? loadProperties("range", _data.melee_properties) : loadProperties("range", _data.range_properties);	
	loadProperties("necklace", _data.necklace_properties);
	loadProperties("charm", _data.charm_properties);
	loadProperties("trinket", _data.trinket_properties);	
	
	loadTraits();
	$(".spinner").hide();	
	$(".mainGrid").removeClass('loading');
	$(".mainGrid").show();
	$(".buildBrowserSection").hide();
}

function loadVideoPlayer(videoAddress) {	
	if (videoAddress.indexOf("twitch.tv") >= 0) {
		let videoId = videoAddress.split('/')[videoAddress.split('/').length - 1];
		$(".twitchPlayer")[0].src = `https://player.twitch.tv/?autoplay=false&video=${videoId}`;
		$(".twitchPlayer").show();
		$(".ytPlayer").hide();

	} else if (videoAddress.indexOf("youtube") >= 0) {
		let videoId = videoAddress.split("v=")[1].split("&")[0];
		$(".ytPlayer")[0].src = `https://www.youtube.com/embed/${videoId}`;
		$(".ytPlayer").show();
		$(".twitchPlayer").hide();
	}
}

function loadMyBuilds() {
	$(".mainGrid").hide();
	$(".myBuildsSection").hide();
	$(".buildBrowserSection").hide();
	
	if ($.fn.DataTable.isDataTable('#myBuildsTable')) {
		$(".myBuildsSection").show();
		return;
	}
	
	$(".spinner").show();
	let author = getCurrentUser() ? getCurrentUser().displayName : "";
	let authorEmail = getCurrentUser() ? getCurrentUser().email : "";
	let buildList = [];
	let promises = [];
	
	if (!authorEmail || authorEmail.length == 0) {
		return;
	}
	
	db.collection("buildTable").where("authorEmail", "==", authorEmail).get().then((queryRef) => {
		let i = 0;
		queryRef.docs.some((doc) => {
			let build = doc.data();
			if (build.name && build.name.length > 0) {					
				build.id = doc.id;
				build.pageViews = !doc.data().pageViews ? 0 : doc.data().pageViews;
				build.heroName = getHero(doc.data().hash).name.split(' ')[0];
				build.careerName = getCareer(doc.data().hash).name;
				promises.push(buildList.push(build));
			}
		});
	
		Promise.all(promises).then((x) => { 	
			var table = $("#myBuildsTable").DataTable({
				data: buildList,
				columns: [
					{ "data": "name" , "title": "Name" },
					{ "data": "heroName" , "title": "Hero", "width": "60px" },
					{ "data": "careerName" , "title": "Career", "width": "100px" },
					{ "data": "pageViews", "title": "Views", "width": "40px", "className": "text-center" }
				],			
				columnDefs: [ {
					targets: [ 1 ],
					orderData: [ 1, 2 ]
				}, {
					targets: [ 2 ],
					orderData: [ 2, 1 ]
				} ],
				"order": [[ 1, "asc" ]]
			});
			
			$(".spinner").hide();
			$(".myBuildsSection").removeClass('loading');
			$(".myBuildsSection").show();
			
			 $('#myBuildsTable tbody').on( 'click', 'tr', function () {
				var data = table.row($(this)).data();
				window.location.href = `/#${data.buildSetId}-${data.id}`;
				window.location.reload();
			} );
			$('#myBuildsTable').DataTable().columns.adjust().draw();
		});
	});
}

function initFirestore() {
	firebase.initializeApp({
	  apiKey: "AIzaSyDtUozP43e9ygkqV0HpKYRFznePouI2zg0",
	  authDomain: "verminbuilds.firebaseapp.com",
	  projectId: "verminbuilds"
	});

	// Initialize Cloud Firestore through Firebase
	db = firebase.firestore();
	
	firebase.auth().onAuthStateChanged(function(user) {
	  if (user) {
		let username = user.displayName ? user.displayName + " " : "";
		$(".mainGrid").addClass("loggedIn");
		$(".userButton").html(`${username}logout`);
		$(".myBuildsButton").css('visibility', 'visible');
		
		if (window.location.hash.length > 0 && window.location.hash.substring(1) == "myBuilds") {
			loadMyBuilds();
		}
		
		currentUser = user;
	  } else {
		$(".mainGrid").removeClass("loggedIn");
		$(".userButton").html("login/register");
		$(".myBuildsButton").css('visibility', 'hidden');
		// No user is signed in.
	  }
	});
	
	let buildList = [];
	let promises = [];
	
	db.collection("buildTable").get().then((queryRef) => {
		$(".buildCountLabel").html(`${queryRef.size} Builds Created`);
		let i = 0;
		queryRef.docs.some((doc) => {
			let build = doc.data();
			if (build.name && build.name.length > 0) {					
				build.id = doc.id;
				build.pageViews = !doc.data().pageViews ? 0 : doc.data().pageViews;
				build.heroName = !getHero(doc.data().hash) ? "" : getHero(doc.data().hash).name.split(' ')[0];
				build.careerName = !getCareer(doc.data().hash) ? "" : getCareer(doc.data().hash).name;
				promises.push(buildList.push(build));
			}
		});
	
		Promise.all(promises).then((x) => { 	
			var table = $("#buildBrowserTable").DataTable({
				data: buildList,
				columns: [
					{ "data": "name" , "title": "Name" },
					{ "data": "heroName" , "title": "Hero", "width": "60px" },
					{ "data": "careerName" , "title": "Career", "width": "100px" },
					{ "data": "author", "title": "Author", "width": "100px" },
					{ "data": "pageViews", "title": "Views", "width": "40px", "className": "text-center" }
				],			
				columnDefs: [ {
					targets: [ 1 ],
					orderData: [ 1, 2 ]
				}, {
					targets: [ 2 ],
					orderData: [ 2, 1 ]
				} ],
				"order": [[ 1, "asc" ]]
			});
			
			$(".spinner").hide();
			$(".buildBrowserSection").removeClass('loading');
			
			 $('#buildBrowserTable tbody').on( 'click', 'tr', function () {
				var data = table.row($(this)).data();
				window.location.href = `/#${data.buildSetId}-${data.id}`;
				window.location.reload();
			} );
			$('#buildBrowserTable').DataTable().columns.adjust().draw();
		});
	});
}

function getHero(hash) {
	let heroHashValue = getHashValue(hash, "hero");	
	return _data.heroes[heroHashValue[0]];
}

function getCareer(hash) {
	let heroHashValue = getHashValue(hash, "hero");	
	return _data.heroes[heroHashValue[0]].careers[heroHashValue[1]];
}

function getWeaponsForHero(heroIndex) {
	let careers = _data.heroes[heroIndex].careers;
	let weapons = []
	
	return _data.melee_weapons.filter((weapon) => {
			for (let career of careers) {
				if (weapon.class.includes(career.name)) {
					return true;
				}
			}
			return false;
		});
}

function initWeaponsPage() {
	let heroIndex = Array.prototype.indexOf.call($(".weaponsDataPage .heroSection").children(),$(".weaponsDataPage .heroSection>div.selected")[0]);
	
	$(".weaponDataMeleeSelection").html('');
	for (let weapon of getWeaponsForHero(heroIndex)) {
		$(".weaponDataMeleeSelection").append(new Option(weapon.name, weapon.templateName));
	}
	
	$(".weaponDataMeleeSelection")[0].selectedIndex = 0;
	renderWeaponDataTable($(".weaponDataMeleeSelection").val());
	$(".spinner").hide();
	$(".weaponsDataPage").show();
}

$(function() {	
	$.ajax({
		url: 'data.json',
		cache: false,
		dataType: 'json',
		success: function(data) {
			_data = data[0];
			_properties = _data.melee_properties.concat(_data.range_properties).concat(_data.necklace_properties).concat(_data.charm_properties).concat(_data.trinket_properties);
			initData();
			if (!_weaponData || !_breedData) {
				return;
			}
			initWeaponsPage();
		}
	});
	
	$.ajax({
		url: 'data/breeds.json',
		cache: false,
		dataType: 'json',
		success: function(data) {
			_breedData = data;
			if (!_weaponData || !_data) {
				return;
			}
			initWeaponsPage();
		}
	});
	
	$.ajax({
		url: 'data/weapons.json',
		cache: false,
		dataType: 'json',
		success: function(data) {
			_weaponData = data;
			if (!_breedData || !_data) {
				return;
			}
			initWeaponsPage();
		}
	});
	
	$.ajax({
		url: 'data/armor.json',
		cache: false,
		dataType: 'json',
		success: function(data) {
			_armorData = data;
		}
	});
	
	$(".mainGrid:not(.locked) .talentSection>div>div").click((e) => { 
		$(e.currentTarget.parentElement).children().removeClass('selected'); 
		$(e.currentTarget.parentElement).children().removeClass('redBorder'); 
		$(e.currentTarget).addClass('selected redBorder'); 
		//$(".footer>input")[0].value = getShareableUrl();
		updateBuild();
	});
	
	$(".mainGrid:not(.locked) .heroSection>div").click((e) => { 
        $(e.currentTarget.parentElement).children().removeClass('selected'); 
        $(e.currentTarget.parentElement).children().removeClass('redBorder'); 
        $(".classSection").children().removeClass('selected'); 
        $(".classSection").children().removeClass('redBorder'); 
        $(e.currentTarget).addClass('selected redBorder'); 
        $($(".classSection").children()[0]).addClass('selected redBorder'); 
        let index = Array.prototype.indexOf.call($(e.currentTarget.parentElement).children(),e.currentTarget);
        loadHero(index, 0);
		//$(".footer>input")[0].value = getShareableUrl();
		updateBuild();
		$(".talentSection>div>div").removeClass("selected")
		
		loadHeroSummary();
    });
	
	$(".weaponsDataPage:not(.locked) .heroSection>div").click((e) => { 
        $(e.currentTarget.parentElement).children().removeClass('selected'); 
        $(e.currentTarget.parentElement).children().removeClass('redBorder');
        $(e.currentTarget).addClass('selected redBorder');
		
		initWeaponsPage();
    });
	
	$(".mainGrid:not(.locked) .classSection>div").click((e) => { 
        $(e.currentTarget.parentElement).children().removeClass('selected'); 
        $(e.currentTarget).addClass('selected'); 
        let index = Array.prototype.indexOf.call($(e.currentTarget.parentElement).children(),e.currentTarget);
        let heroIndex = Array.prototype.indexOf.call($(".heroSection").children(),$(".heroSection>div.selected")[0]);
		loadHero(heroIndex, index);
		updateBuild();
		$(".talentSection>div>div").removeClass("selected")
		loadHeroSummary();
    });
	
	$(".mainGrid:not(.locked) .newLoadoutButton").click((e) => { 
		let buildName = $(".buildName").val();
		if (!buildName || buildName.length == 0) {
			alert("Please give the current build a name before creating a new one");
			return;
		}
        createNewLoadout();
    });
	
	$(".mainGrid:not(.locked) .meleeSelection").change((e) => { 
		updateBuild();
    });		
	
	$(".mainGrid:not(.locked) .rangeSelection").change((e) => { 
		updateBuild();
    });		
	
	$(".mainGrid:not(.locked) .traitSelection").change((e) => { 
        loadTraits();
		updateBuild();
    });
	
	$('.mainGrid:not(.locked) input[type="number"]').change((e) => { 
		updateBuild();
    });
	
	
	$('.mainGrid:not(.locked) input[type="text"]').change((e) => { 
		updateBuild();
		if (e.currentTarget.classList.value.indexOf("buildName") >= 0) {
			updateLoadoutSelection();
		}
    });
	
	$('.mainGrid:not(.locked) textarea').change((e) => { 
		updateBuild();
    });
	
	$('.mainGrid:not(.locked) input.relatedVideo').change((e) => { 
		let videoAddress = e.currentTarget.value;
		loadVideoPlayer(videoAddress);
    });
	
	$(".mainGrid:not(.locked) .propertySelection").change((e) => { 
		let property1Text = e.currentTarget.options[e.currentTarget.selectedIndex].text
		
		let property1 = _properties.filter(function (item) { return item.name.includes(property1Text); })[0];
		
		$(e.currentTarget.nextSibling.nextSibling).attr({ 
			"min": property1.min_value,
			"max": property1.max_value,
			"value": property1.max_value,
			"step": property1.step
		});
		
		$(e.currentTarget.nextSibling.nextSibling).val(property1.max_value);
		//$(".footer>input")[0].value = getShareableUrl();
		updateBuild();
	});
	
	$(".loadoutSelection").change((e) => {
		window.location.hash = window.location.hash.substring(1).split('-')[0] + '-' + $(".loadoutSelection")[0].options[$(".loadoutSelection")[0].selectedIndex].value;
		loadBuild();
	});
	
	$(".userButton").click((e) => {
		if ($(".mainGrid").hasClass('loggedIn')) {
			firebase.auth().signOut().then(function() {
			  alert("You have been logged out");
			}).catch(function(error) {
			  alert("An error occurred when logging you out");
			});
			$(".mainGrid").removeClass('loggedIn');
			$(".userButton").html('login/register');
			return;
		}
		
		$(".userWindow").css('display','grid');
	});
	
	$(".userWindowCloseButton").click((e) => {
		$(".userWindow").hide();
	});
	
	$(".userWindow .loginTabButton").click((e) => {
		$(".userWindow").addClass('loginWindow');
		$(".userWindow").removeClass('registerWindow');
	});
	
	$(".userWindow .registerTabButton").click((e) => {
		$(".userWindow").addClass('registerWindow');
		$(".userWindow").removeClass('loginWindow');
	});
	
	$(".registerButton").click((e) => {
		let username = $('input[name="username"]').val();
		let email = $('input[name="email"]').val();
		let pwd = $('input[name="password"]').val();
		let pwd2 = $('input[name="password2"]').val();
		
		if (pwd != pwd2) {
			alert("Passwords don't match");
			return;
		}
		
		if (!username || username.length < 3) {
			alert("Username must be at least 3 characters");
			return;
		}
		
		firebase.auth().createUserWithEmailAndPassword(email, pwd).then(function() {
			let user = getCurrentUser();
			
			if (!user) {
				console.log("could not update user information");
				return;
			}
			
			user.updateProfile({
			  displayName: username,
			}).then(function() {
				console.log("User information updated");
				$(".userButton").html(`${username} logout`);				
			}).catch(function(error) {
				console.log("Could not update user information");
			});
					
			$(".mainGrid").addClass("loggedIn");
			$(".userWindow").hide();
		}).catch(function(error) {
		  // Handle Errors here.
		  var errorCode = error.code;
		  var errorMessage = error.message;
		  // ...
		  alert(`${errorCode} - ${errorMessage}`);
		  return;
		});
	});
	
	$(".loginButton").click((e) => {
		let email = $('input[name="email"]').val();
		let pwd = $('input[name="password"]').val();
		
		firebase.auth().signInWithEmailAndPassword(email, pwd).then(function() {
			$(".mainGrid").addClass("loggedIn");		
			$(".userWindow").hide();
		}).catch(function(error) {
		  // Handle Errors here.
		  var errorCode = error.code;
		  var errorMessage = error.message;
		  // ...
		  alert(`${errorCode} - ${errorMessage}`);
		  return;
		});
	});

	$(".editBuildButton").click((e) => {
		$(".mainGrid").removeClass("locked");
		$(".buildDescription")[0].disabled = false;
	});
	
	
	$(".cloneBuildButton").click((e) => {
		cloneBuild();
	});
	
	$(".cloneBuildSetButton").click((e) => {
		cloneBuildSet();
	});

	$(".createButton").click((e) => {
		window.location.href = "/";
	});	
	
	$(".browseButton").click((e) => {
		$(".mainGrid").hide();
		$(".myBuildsSection").hide();
		$(".buildBrowserSection").show();
		window.location.hash = "buildBrowser";
	});
	
	$(".weaponsButton").click((e) => {
		$(".page").hide();
		$(".weaponsDataPage").show();
		window.location.hash = "weapons";
		
		initWeaponsPage();
	});
	
	$(".enemiesButton").click((e) => {
		$(".page").hide();
		$(".enemiesPage").show();
		window.location.hash = "enemies";
	});
	
	$(".page").on("click", ".sectionTitle", ((e) => { 
		$(e.currentTarget).next().toggle(); 
	}));
	
	$(".myBuildsButton").click((e) => { 
		loadMyBuilds();
		window.location.hash = "myBuilds";
	});
	
	$(".damageCleaveStaggerButton").click((e) => {
		if ($(".weaponAttackStatsContainer").hasClass('showDamage')) {
			$(".weaponAttackStatsContainer").removeClass('showDamage');
			$(".weaponAttackStatsContainer").addClass('showCleave');
			$($(e.currentTarget).find("span")[0]).html('Show Cleave');
			
		} 
		else if ($(".weaponAttackStatsContainer").hasClass('showCleave')) {
			$(".weaponAttackStatsContainer").removeClass('showCleave');
			$(".weaponAttackStatsContainer").addClass('showStagger');
			$($(e.currentTarget).find("span")[0]).html('Show Stagger');			
		}
		else if ($(".weaponAttackStatsContainer").hasClass('showStagger')) {
			$(".weaponAttackStatsContainer").removeClass('showStagger');
			$(".weaponAttackStatsContainer").addClass('showDamage');
			$($(e.currentTarget).find("span")[0]).html('Show Damage');			
		}
	});
	
	$(".strengthButton").click((e) => {
		if ($(".weaponAttackStatsContainer").hasClass('showStrength')) {
			$(".weaponAttackStatsContainer").removeClass('showStrength');
			$($(e.currentTarget).find("span")[0]).html('Show Strength');			
			return;
		}
		$(".weaponAttackStatsContainer").addClass('showStrength');
		$($(e.currentTarget).find("span")[0]).html('Hide Strength');
	});
	
	$(".showEnemiesButton").click((e) => {
		if ($(".weaponAttackStatsContainer").hasClass('showEnemies')) {
			$(".weaponAttackStatsContainer").removeClass('showEnemies');
			$(".weaponAttackStatsContainer").removeClass('showRegulars');
			$(".weaponAttackStatsContainer").removeClass('showElites');
			$(".weaponAttackStatsContainer").removeClass('showSpecials');
			$(".weaponAttackStatsContainer").removeClass('showLords');
			
			$($(e.currentTarget).find("span")[0]).html('Show Enemies');	
			$(".showRegularsButton>span:first-child").html('Show Regular');
			$(".showElitesButton>span:first-child").html('Show Elites');
			$(".showSpecialsButton>span:first-child").html('Show Specials');
			$(".showLordsButton>span:first-child").html('Show Lords');
			return;
		}
		
		$(".weaponAttackStatsContainer").addClass('showEnemies');
		$(".weaponAttackStatsContainer").addClass('showRegulars');
		$(".weaponAttackStatsContainer").addClass('showElites');
		$(".weaponAttackStatsContainer").addClass('showSpecials');
		$(".weaponAttackStatsContainer").addClass('showLords');
		
		$($(e.currentTarget).find("span")[0]).html('Hide Enemies');	
		$(".showRegularsButton>span:first-child").html('Hide Regular')
		$(".showElitesButton>span:first-child").html('Hide Elites')
		$(".showSpecialsButton>span:first-child").html('Hide Specials')
		$(".showLordsButton>span:first-child").html('Hide Lords')
	});
	
	$(".showRegularsButton").click((e) => {
		if ($(".weaponAttackStatsContainer").hasClass('showRegulars')) {
			$(".weaponAttackStatsContainer").removeClass('showRegulars');
			$($(e.currentTarget).find("span")[0]).html('Show Regular');			
			return;
		}
		$(".weaponAttackStatsContainer").addClass('showRegulars');
		$($(e.currentTarget).find("span")[0]).html('Hide Regular');
	});
	
	$(".showElitesButton").click((e) => {
		if ($(".weaponAttackStatsContainer").hasClass('showElites')) {
			$(".weaponAttackStatsContainer").removeClass('showElites');
			$($(e.currentTarget).find("span")[0]).html('Show Elites');			
			return;
		}
		$(".weaponAttackStatsContainer").addClass('showElites');
		$($(e.currentTarget).find("span")[0]).html('Hide Elites');
	});
	
	$(".showSpecialsButton").click((e) => {
		if ($(".weaponAttackStatsContainer").hasClass('showSpecials')) {
			$(".weaponAttackStatsContainer").removeClass('showSpecials');
			$($(e.currentTarget).find("span")[0]).html('Show Specials');			
			return;
		}
		$(".weaponAttackStatsContainer").addClass('showSpecials');
		$($(e.currentTarget).find("span")[0]).html('Hide Specials');
	});
	
	$(".showLordsButton").click((e) => {
		if ($(".weaponAttackStatsContainer").hasClass('showLords')) {
			$(".weaponAttackStatsContainer").removeClass('showLords');
			$($(e.currentTarget).find("span")[0]).html('Show Lords');			
			return;
		}
		$(".weaponAttackStatsContainer").addClass('showLords');
		$($(e.currentTarget).find("span")[0]).html('Hide Lords');
	});
	
	$(".weaponDataMeleeSelection").change((e) => {
		renderWeaponDataTable($(".weaponDataMeleeSelection").val());
	});
	
	$(".weaponsDataPage").on("click", ".weaponDamageType.infantry", ((e) => {
		if ($(".weaponAttackStatsContainer").hasClass('showInfantry')) {
			$(".weaponAttackStatsContainer").toggleClass('showInfantry');
			$(".weaponAttackStatsContainer").toggleClass('hideInfantry');
		}
		else {
			$(".weaponAttackStatsContainer").toggleClass('showInfantry');
			$(".weaponAttackStatsContainer").toggleClass('hideInfantry');	
			$(".weaponAttackStatsContainer").toggleClass('showInfantry');		
		}
	}));
	
	$(".weaponsDataPage").on("click", ".weaponDamageType.armored", ((e) => {
		$(".weaponAttackStatsContainer").toggleClass('showArmored');
		if ($(".weaponAttackStatsContainer").hasClass('showArmored')) {
			$(".weaponAttackStatsContainer").toggleClass('showArmored');
			$(".weaponAttackStatsContainer").toggleClass('hideArmored');
		}
		else {
			$(".weaponAttackStatsContainer").toggleClass('showArmored');
			$(".weaponAttackStatsContainer").toggleClass('hideArmored');	
			$(".weaponAttackStatsContainer").toggleClass('showArmored');		
		}
	}));
	
	$(".weaponsDataPage").on("click", ".weaponDamageType.monsters", ((e) => {
		$(".weaponAttackStatsContainer").toggleClass('showMonsters');
		if ($(".weaponAttackStatsContainer").hasClass('showMonsters')) {
			$(".weaponAttackStatsContainer").toggleClass('showMonsters');
			$(".weaponAttackStatsContainer").toggleClass('hideMonsters');
		}
		else {
			$(".weaponAttackStatsContainer").toggleClass('showMonsters');
			$(".weaponAttackStatsContainer").toggleClass('hideMonsters');	
			$(".weaponAttackStatsContainer").toggleClass('showMonsters');		
		}
	}));
	
	$(".weaponsDataPage").on("click", ".weaponDamageType.berserkers", ((e) => {
		$(".weaponAttackStatsContainer").toggleClass('showBerserkers');
		if ($(".weaponAttackStatsContainer").hasClass('showBerserkers')) {
			$(".weaponAttackStatsContainer").toggleClass('showBerserkers');
			$(".weaponAttackStatsContainer").toggleClass('hideBerserkers');
		}
		else {
			$(".weaponAttackStatsContainer").toggleClass('showBerserkers');
			$(".weaponAttackStatsContainer").toggleClass('hideBerserkers');	
			$(".weaponAttackStatsContainer").toggleClass('showBerserkers');		
		}
	}));
	
	$(".weaponsDataPage").on("click", ".weaponDamageType.super.armor", ((e) => {
		$(".weaponAttackStatsContainer").toggleClass('showSuperArmor');
		if ($(".weaponAttackStatsContainer").hasClass('showSuperArmor')) {
			$(".weaponAttackStatsContainer").toggleClass('showSuperArmor');
			$(".weaponAttackStatsContainer").toggleClass('hideSuperArmor');
		}
		else {
			$(".weaponAttackStatsContainer").toggleClass('showSuperArmor');
			$(".weaponAttackStatsContainer").toggleClass('hideSuperArmor');	
			$(".weaponAttackStatsContainer").toggleClass('showSuperArmor');		
		}
	}));
});

function getCurrentUser() {
	return firebase.auth().currentUser;
}


/******************
Weapons Data Table
******************/

function getWeaponTemplate(weaponTemplateName) {
	if (!_weaponData) {
		return;
	}
	return _weaponData.find((x) => x.template_name == weaponTemplateName);
}

function isAttackEquivalent(attack1, attack2) {
	if (!attack1.damage_profile && attack2.damage_profile) {
		return false;
	}
	if (!attack1.damage_profile && !attack2.damage_profile) {
		if (attack1.damage_profile_left.armor_modifier) {		
			for (let i = 0; i < attack1.damage_profile_left.armor_modifier.attack.length; i++) {
				if (attack1.damage_profile_left.armor_modifier.attack[i] != attack2.damage_profile_left.armor_modifier.attack[i] ||
					attack1.damage_profile_right.armor_modifier.impact[i] != attack2.damage_profile_right.armor_modifier.impact[i]) {
					return false;
				}
			}
		}
		
		if (attack1.damage_profile_left.critical_strike) {
			for (let i = 0; i < attack1.damage_profile_left.critical_strike.attack_armor_power_modifer.length; i++) {
				if (attack1.damage_profile_left.critical_strike.attack_armor_power_modifer[i] != attack2.damage_profile_left.critical_strike.attack_armor_power_modifer[i] ||
					attack1.damage_profile_right.critical_strike.attack_armor_power_modifer[i] != attack2.damage_profile_right.critical_strike.attack_armor_power_modifer[i]) {
					return false;
				}
			}
		}
		
		
		if (attack1.damage_profile_left.targets.length > 1) {
			for (let i = 0; i < attack1.damage_profile_left.targets.length; i++) {
				if (attack1.damage_profile_left.targets[i].boost_curve_coefficient_headshot != attack2.damage_profile_left.targets[i].boost_curve_coefficient_headshot ||
					attack1.damage_profile_left.targets[i].power_distribution.attack != attack2.damage_profile_left.targets[i].power_distribution.attack ||
					attack1.damage_profile_left.targets[i].power_distribution.impact != attack2.damage_profile_left.targets[i].power_distribution.impact ||
					attack1.damage_profile_right.targets[i].boost_curve_coefficient_headshot != attack2.damage_profile_right.targets[i].boost_curve_coefficient_headshot ||
					attack1.damage_profile_right.targets[i].power_distribution.attack != attack2.damage_profile_right.targets[i].power_distribution.attack ||
					attack1.damage_profile_right.targets[i].power_distribution.impact != attack2.damage_profile_right.targets[i].power_distribution.impact ) {
					return false;
				}
		
				for (let j = 0; j < attack1.damage_profile_left.targets[i].boost_curve.length; j++) {
					if (attack1.damage_profile_left.targets[i].boost_curve[j] != attack2.damage_profile_left.targets[i].boost_curve[j] ||
						attack1.damage_profile_right.targets[i].boost_curve[j] != attack2.damage_profile_right.targets[i].boost_curve[j]) {
						return false;
					}
				}			
			}
		}
		
		for (let i = 0; i < attack1.damage_profile_left.default_target.boost_curve.length; i++) {
			if (attack1.damage_profile_left.default_target.boost_curve[i] != attack2.damage_profile_left.default_target.boost_curve[i] ||
				attack1.damage_profile_right.default_target.boost_curve[i] != attack2.damage_profile_right.default_target.boost_curve[i]) {
				return false;
			}
		}
		
		return  attack1.additional_critical_strike_chance == attack2.additional_critical_strike_chance &&
				attack1.damage_profile_left.cleave_distribution.attack == attack2.damage_profile_left.cleave_distribution.attack &&
				attack1.damage_profile_left.cleave_distribution.impact == attack2.damage_profile_left.cleave_distribution.impact &&
				attack1.damage_profile_left.default_target.power_distribution.attack == attack2.damage_profile_left.default_target.power_distribution.attack &&
				attack1.damage_profile_left.default_target.power_distribution.impact == attack2.damage_profile_left.default_target.power_distribution.impact &&
				attack1.damage_profile_right.cleave_distribution.attack == attack2.damage_profile_right.cleave_distribution.attack &&
				attack1.damage_profile_right.cleave_distribution.impact == attack2.damage_profile_right.cleave_distribution.impact &&
				attack1.damage_profile_right.default_target.power_distribution.attack == attack2.damage_profile_right.default_target.power_distribution.attack &&
				attack1.damage_profile_right.default_target.power_distribution.impact == attack2.damage_profile_right.default_target.power_distribution.impact;
	}
		
	if (attack1.damage_profile.armor_modifier) {		
		for (let i = 0; i < attack1.damage_profile.armor_modifier.attack.length; i++) {
			if (attack1.damage_profile.armor_modifier.attack[i] != attack2.damage_profile.armor_modifier.attack[i]) {
				return false;
			}
		}
	}
	
	if (attack1.damage_profile.critical_strike) {
		for (let i = 0; i < attack1.damage_profile.critical_strike.attack_armor_power_modifer.length; i++) {
			if (attack1.damage_profile.critical_strike.attack_armor_power_modifer[i] != attack2.damage_profile.critical_strike.attack_armor_power_modifer[i]) {
				return false;
			}
		}
	}
	
	
	if (attack1.damage_profile.targets.length > 1) {
		for (let i = 0; i < attack1.damage_profile.targets.length; i++) {
			if (attack1.damage_profile.targets[i].boost_curve_coefficient_headshot != attack2.damage_profile.targets[i].boost_curve_coefficient_headshot ||
				attack1.damage_profile.targets[i].power_distribution.attack != attack2.damage_profile.targets[i].power_distribution.attack ||
				attack1.damage_profile.targets[i].power_distribution.impact != attack2.damage_profile.targets[i].power_distribution.impact) {
				return false;
			}
	
			for (let j = 0; j < attack1.damage_profile.targets[i].boost_curve.length; j++) {
				if (attack1.damage_profile.targets[i].boost_curve[j] != attack2.damage_profile.targets[i].boost_curve[j]) {
					return false;
				}
			}			
		}
	}
	
	for (let i = 0; i < attack1.damage_profile.default_target.boost_curve.length; i++) {
		if (attack1.damage_profile.default_target.boost_curve[i] != attack2.damage_profile.default_target.boost_curve[i]) {
			return false;
		}
	}
	
	return  attack1.additional_critical_strike_chance == attack2.additional_critical_strike_chance &&
			attack1.damage_profile.cleave_distribution.attack == attack2.damage_profile.cleave_distribution.attack &&
			attack1.damage_profile.cleave_distribution.impact == attack2.damage_profile.cleave_distribution.impact &&
			attack1.damage_profile.default_target.power_distribution.attack == attack2.damage_profile.default_target.power_distribution.attack &&
			attack1.damage_profile.default_target.power_distribution.impact == attack2.damage_profile.default_target.power_distribution.impact;
}

function getGroupedAttacks(attackList) {
	if (attackList.length == 1) {
		return [ attackList ];
	}
	
	let attackGroupList = [];
	let attackGroup = [];
	
	let i = 0;
	for (let attack of attackList) {
		if (attackGroup.length == 0) {
			attackGroup.push(attack);
			continue;
		}
		
		if (isAttackEquivalent(attackGroup[0], attack)) {
			attackGroup.push(attack);
			continue;
		}
		
		attackGroupList.push(attackGroup);
		attackGroup = [];
		attackGroup.push(attack);
	}
	attackGroupList.push(attackGroup);
	return attackGroupList;
}

function getAttackIcon(attackTemplate) {
	return '';
}

function isMultiTargetAttack(attackTemplate) {
	return !attackTemplate.damage_profile ? attackTemplate.damage_profile_left.targets.length > 1 : attackTemplate.damage_profile.targets.length > 1;
}

function getAttackSwingDirectionClass(attackTemplate) {
	// TODO: Add template keys to melee data.json that map to attack swing icons
	return attackTemplate.attack_name.indexOf("left_diagonal") >= 0 ? "swingDownLeft" :
			attackTemplate.attack_name.indexOf("right_diagonal") >= 0 ? "swingDownRight" :
			attackTemplate.attack_name.indexOf("down") >= 0 ? "swingDown" :
			attackTemplate.attack_name.indexOf("right") >= 0 ? "swingRight" :
			attackTemplate.attack_name.indexOf("left") >= 0 ? "swingLeft" :
			attackTemplate.attack_name.indexOf("up") >= 0 ? "swingUp" :
			attackTemplate.attack_name.indexOf("bopp") >= 0 ? "swingDown" :
			attackTemplate.attack_name.indexOf("last") >= 0 ? "swingDown" :
			attackTemplate.attack_name.indexOf("stab") >= 0 ? "swingStab" :
			!attackTemplate.damage_profile ? "swingDoubleDown" : "swingDefault";
}

function getAttackIconHtml(attackTemplate) {	
	let attackName = attackTemplate.attack_name == "light_attack_bopp" ? "Push Stab" : attackTemplate.attack_name.replace("light_attack_","").replace("heavy_attack_","").replace("_"," ").trim(' ');
	let attackModifierName = !attackTemplate.damage_profile ? attackTemplate.damage_profile_left.default_target.boost_curve_type.replace("curve","").replace("_"," ").trim(' ') : attackTemplate.damage_profile.default_target.boost_curve_type.replace("curve","").replace("_"," ").trim(' ');
	let attackSwingDirectionClass = getAttackSwingDirectionClass(attackTemplate);
	
	return `<div class="weaponAttackSwingIcon ${attackSwingDirectionClass} grid redBorder"><span class="attackIcon"></span><span class="attackText attackModifierText">${attackModifierName}</span><span class="attackText">${attackName}</span></div>`
}

function renderWeaponDataTable(weaponTemplateName, heroPowerLevel, difficultyLevel) {	
	let weaponDataTable = $(".weaponAttackDataTable");
	weaponDataTable.html('');
	
	let weaponTemplate = getWeaponTemplate(weaponTemplateName);
	
	let lightAttacks = getGroupedAttacks(weaponTemplate.attacks.light_attack);
	let heavyAttacks = getGroupedAttacks(weaponTemplate.attacks.heavy_attack);
	let pushStab = [ weaponTemplate.attacks.push_stab ];
	
	let attackGroups = [lightAttacks, heavyAttacks, pushStab];
	let attackSections = ["Light Attacks", "Heavy Attacks", "Push Stab"];
	
	for (let i = 0; i < attackSections.length; i++) {
		let sectionNameHtml = `<div class="sectionTitle center"><span>${attackSections[i]}</span></div>`;
		weaponDataTable.append(sectionNameHtml);
		weaponDataTable.append(`<div class="weaponAttackSwingsContainer"></div>`);
		
		for (let j = 0; j < attackGroups[i].length; j++) {
			let attackGroup = attackGroups[i][j];
			let weaponAttackSwingsContainer = $(".weaponAttackDataTable .weaponAttackSwingsContainer:last-child");
			let attackTemplate = attackGroup[0];
			
			// Attack Swing Icons
			weaponAttackSwingsContainer.append(`<div class="weaponAttackSwingTable grid"><div class="weaponAttackSwings flex"></div></div>`);
			let weaponAttackSwingTable = $(".weaponAttackDataTable .weaponAttackSwingsContainer:last-child .weaponAttackSwingTable:last-child");
			let weaponAttackSwingGroup = $(".weaponAttackDataTable .weaponAttackSwingsContainer:last-child .weaponAttackSwingTable:last-child .weaponAttackSwings");
			
			for (let attack of attackGroup) {
				let attackIconHtml = getAttackIconHtml(attack);
				weaponAttackSwingGroup.append(attackIconHtml);
			}
			
			weaponAttackSwingTable.append('<div class="attackTemplateDataTable weaponDamageTable grid damageTable"></div>');
			let attackSwingDataTable = $(".weaponAttackDataTable .weaponAttackSwingsContainer:last-child .weaponAttackSwingTable:last-child .attackTemplateDataTable");
			
			// Attack Swing Table Header	
			
			let targetIconContainersHtml = '';
			if (attackTemplate.damage_profile.targets && attackTemplate.damage_profile.targets.length > 0) {
				let targetsHeaderHtml = '';
				let targetCount = attackTemplate.damage_profile.targets.length + 1;
				
				let iconsHtml = '';
				
				for (let i = 0; i < targetCount; i++) {
					iconsHtml += `<i class="fa fa-male center"></i>`;
				}
				iconsHtml = `<div class="center">${iconsHtml}</div>`;
				
				for (let i = 0; i < targetCount; i++) {
					targetIconContainersHtml += iconsHtml;
				}
			}
			
			let headerRow = `<div class="attackTableTitle flex center">
								<span class="tableTitle">Damage - Hits to Kill</span>
							</div>
							<div class="weaponDamageHeader grid">
								<div class="enemyNameHeader grid">
									<span class="center">Enemy</span>
								</div>
								<div class="enemyRaceHeader grid">
									<span class="center">Race</span>
								</div>
								<div class="enemyHealthHeader grid">
									<div class="heart"></div>
								</div>
								<div class="normalDamage grid"><span class="center">Normal</span>${targetIconContainersHtml}</div>
								<div class="headshotDamage grid"><span class="center">Headshot</span>${targetIconContainersHtml}</div>
								<div class="critDamage grid"><span class="center">Crit</span>${targetIconContainersHtml}</div>
								<div class="critHeadshotDamage grid"><span class="center">Crit Headshot</span>${targetIconContainersHtml}</div>
							</div>`;
						
							
			attackSwingDataTable.append(headerRow);
			
			
			if (isMultiTargetAttack(attackTemplate)) {
				//renderMultiTargetAttackData();
				renderAttackData(attackTemplate);
				continue;
			}
				
			renderAttackData(attackTemplate);
		}		
	}	
}

function renderMultiTargetAttackData(attackTemplate, armor) {
	let attackSwingDataTable = $(".weaponAttackDataTable .weaponAttackSwingsContainer:last-child .weaponAttackSwingTable:last-child .weaponDamageTable");
	
	let damageProfile = !attackTemplate.damage_profile ? attackTemplate.damage_profile_left : attackTemplate.damage_profile;
	
	let targetDamageProfiles = [];
	
	for (let i = 0; i < attackTemplate.damage_profile.targets.length; i++) {
		targetDamageProfiles.push(attackTemplate.damage_profile.targets[i]);
	}
	targetDamageProfiles.push(attackTemplate.damage_profile.default_target);
	
	let armorCssClass = armor.name.split('(')[0].toLowerCase().trim(' ');
	
	
	let normalDamageHtml = '';
	let headshotDamageHtml = '';
	let critDamageHtml = '';
	let critHeadshotDamageHtml = '';
	
	let normalHitsToKillHtml = '';
	let headshotHitsToKillHtml = '';
	let critHitsToKillHtml = '';
	let critHeadshotHitsToKillHtml = '';
	
	let damageTypeValues = [[],[],[],[]];
	
	for (let targetDamageProfile of targetDamageProfiles) {
		let rawDamage = targetDamageProfile.power_distribution.attack / 10;
		let scaledDamage = rawDamage * getScaledPowerLevel();
		
		// set super armor index to armor if no super armor value present
		let armorIndex = armor.value == "6" && !damageProfile.armor_modifier.attack[armor.value] ? 1 : armor.value - 1;		
		let armorClassBaseNormalDamage = scaledDamage * damageProfile.armor_modifier.attack[armorIndex];
		
		let critModifier = !damageProfile.critical_strike ? attackTemplate.additional_critical_strike_chance + 1 : damageProfile.critical_strike.attack_armor_power_modifer[armorIndex];
		let armorClassBaseCritDamage = scaledDamage * critModifier;
	
		let armorClassNormalDamage = (Math.round(armorClassBaseNormalDamage * 4) / 4).toFixed(2);
		let armorClassCritDamage = (Math.round((armorClassBaseCritDamage + (armorClassBaseCritDamage * getAdditionalCritMultiplier(damageProfile.default_target, armor.value))) * 4) / 4).toFixed(2);
		let armorClassHeadshotDamage = armorClassBaseNormalDamage == 0 ? (Math.round((getAdditionalHeadshotMultiplier(damageProfile.default_target, armor.value) * 1) * 4) / 4).toFixed(2) : (Math.round((armorClassBaseNormalDamage + (armorClassBaseNormalDamage * getAdditionalHeadshotMultiplier(damageProfile.default_target, armor.value))) * 4) / 4).toFixed(2);
		let armorClassCritHeadshotDamage = (Math.round((armorClassBaseCritDamage + (armorClassBaseCritDamage * getAdditionalCritHeadshotMultiplier(damageProfile.default_target, armor.value))) * 4) / 4).toFixed(2);
		
		damageTypeValues[0].push(armorClassNormalDamage); 
		damageTypeValues[1].push(armorClassCritDamage);
		damageTypeValues[2].push(armorClassHeadshotDamage);
		damageTypeValues[3].push(armorClassCritHeadshotDamage);
		
		normalDamageHtml += `<div class="targetValue grid"><span class="center">${armorClassNormalDamage}</span></div>`;
		headshotDamageHtml += `<div class="targetValue grid"><span class="center">${armorClassCritDamage}</span></div>`;
		critDamageHtml += `<div class="targetValue grid"><span class="center">${armorClassHeadshotDamage}</span></div>`;
		critHeadshotDamageHtml += `<div class="targetValue grid"><span class="center">${armorClassCritHeadshotDamage}</span></div>`;		
	}
	
	let armorHeaderRow = `<div class="weaponDamageType grid ${armorCssClass}">
						<div class="damageType grid"><span class="center">${armor.name}</span></div>
						<div class="normalDamage damageCell grid">${normalDamageHtml}</span></div>
						<div class="headshotDamage damageCell grid">${headshotDamageHtml}</div>
						<div class="critDamage damageCell grid">${critDamageHtml}</div>
						<div class="critHeadshotDamage damageCell grid">${critHeadshotDamageHtml}</div>
					</div>`;
	
	
	// let armorHeaderRow = `<div class="weaponDamageType grid ${armorCssClass}">
							// <div class="damageType grid"><span class="center">${armor.name}</span></div>
							// <div class="normalDamage damageCell grid"><span class="center">${armorClassNormalDamage}</span></div>
							// <div class="headshotDamage damageCell grid"><span class="center">${armorClassHeadshotDamage}</span></div>
							// <div class="critDamage damageCell grid"><span class="center">${armorClassCritDamage}</span></div>
							// <div class="critHeadshotDamage damageCell grid"><span class="center">${armorClassCritHeadshotDamage}</span></div>
						// </div>`;
						
	attackSwingDataTable.append(armorHeaderRow);
	
	for (let breed of getBreedsForArmorClass(armor)) {
		let hitsToKillNormalHtml = '';
		let hitsToKillCritHtml = '';
		let hitsToKillHeadshotHtml = ''; 
		let hitsToKillCritHeadshotHtml = '';
		
		for (let i =0; i < targetDamageProfiles.length; i++) {
	
			let hitsToKillNormal = getHitsToKill(breed, damageTypeValues[0][i]);
			let hitsToKillCrit = getHitsToKill(breed, damageTypeValues[1][i]);
			let hitsToKillHeadshot = getHitsToKill(breed, damageTypeValues[2][i]);
			let hitsToKillCritHeadshot = getHitsToKill(breed, damageTypeValues[3][i]);
			
			hitsToKillNormalHtml += `<div class="targetValue grid"><span class="center">${hitsToKillNormal}</span></div>`;
			hitsToKillCritHtml += `<div class="targetValue grid"><span class="center">${hitsToKillCrit}</span></div>`;
			hitsToKillHeadshotHtml += `<div class="targetValue grid"><span class="center">${hitsToKillHeadshot}</span></div>`;
			hitsToKillCritHeadshotHtml += `<div class="targetValue grid"><span class="center">${hitsToKillCritHeadshot}</span></div>`;
			
		}
		
		let breedNameCssClass = breed.name.split(" ").join('').toLowerCase();

		let breedRow = `<div class="weaponDamageEnemy grid ${breed.race.toLowerCase()} ${armorCssClass} ${breed.type.toLowerCase()} ${breedNameCssClass}">
						   <div class="enemyName grid"><span class="center">${breed.name}</span></div>
						   <div class="enemyRace grid"><i class="raceIcon"></i></div>
						   <div class="enemyHealth grid"><span class="center">${breed.legendHp}</span></div>
						   <div class="normalDamage damageCell grid">
							  <div class="enemyBreakpointBar flex center damageIndicator">
								 ${hitsToKillNormalHtml}
							  </div>
							  <div class="flex center cleaveIndicator">
								 <span class="center">8</span>
							  </div>
							  <div class="flex center staggerIndicator">
								 <span class="center">8</span>
							  </div>
						   </div>
						   <div class="critDamage damageCell grid">
							  <div class="enemyBreakpointBar flex center damageIndicator">
								 ${hitsToKillCritHtml}
							  </div>							  
							  <div class="flex center cleaveIndicator">
								 <span class="center">8</span>
							  </div>
							  <div class="flex center staggerIndicator">
								 <span class="center">8</span>
							  </div>
						   </div>
						   <div class="headshotDamage grid">
							  <div class="enemyBreakpointBar flex center damageIndicator">
								 ${hitsToKillHeadshotHtml}
							  </div>							  
							  <div class="flex center cleaveIndicator">
								 <span class="center">8</span>
							  </div>
							  <div class="flex center staggerIndicator">
								 <span class="center">8</span>
							  </div>
						   </div>
						   <div class="critHeadshotDamage grid">
							  <div class="enemyBreakpointBar flex center damageIndicator">
								 ${hitsToKillCritHeadshotHtml}
							  </div>							  
							  <div class="flex center cleaveIndicator">
								 <span class="center">8</span>
							  </div>
							  <div class="flex center staggerIndicator">
								 <span class="center">8</span>
							  </div>
						   </div>
						</div>`;
		attackSwingDataTable.append(breedRow);
	}
}
	
function renderAttackData(attackTemplate) {
	let attackSwingDataTable = $(".weaponAttackDataTable .weaponAttackSwingsContainer:last-child .weaponAttackSwingTable:last-child .weaponDamageTable");
		
	let damageProfile = !attackTemplate.damage_profile ? attackTemplate.damage_profile_left : attackTemplate.damage_profile;
	let rawDamage = damageProfile.default_target.power_distribution.attack / 10;
	let scaledDamage = rawDamage * getScaledPowerLevel();
	
	let i = 0;
	for (let armor of _armorData) {
		if (armor.value == "4") {
			i++;
			continue;
		}
		
		if (damageProfile.targets && damageProfile.targets.length > 0) {
			renderMultiTargetAttackData(attackTemplate, armor);
			return;
		}
		
		// set super armor index to armor if no super armor value present
		let armorIndex = armor.value == "6" && !damageProfile.armor_modifier.attack[i] ? 1 : i;		
		let armorClassBaseNormalDamage = scaledDamage * damageProfile.armor_modifier.attack[armorIndex];
		
		let critModifier = !damageProfile.critical_strike ? attackTemplate.additional_critical_strike_chance + 1 : damageProfile.critical_strike.attack_armor_power_modifer[armorIndex];
		let armorClassBaseCritDamage = scaledDamage * critModifier;
		
		let armorClassNormalDamage = (Math.round(armorClassBaseNormalDamage * 4) / 4).toFixed(2);
		let armorClassCritDamage = (Math.round((armorClassBaseCritDamage + (armorClassBaseCritDamage * getAdditionalCritMultiplier(damageProfile.default_target, armor.value))) * 4) / 4).toFixed(2);
		let armorClassHeadshotDamage = armorClassBaseNormalDamage == 0 ? (Math.round((getAdditionalHeadshotMultiplier(damageProfile.default_target, armor.value) * 1) * 4) / 4).toFixed(2) : (Math.round((armorClassBaseNormalDamage + (armorClassBaseNormalDamage * getAdditionalHeadshotMultiplier(damageProfile.default_target, armor.value))) * 4) / 4).toFixed(2);
		let armorClassCritHeadshotDamage = (Math.round((armorClassBaseCritDamage + (armorClassBaseCritDamage * getAdditionalCritHeadshotMultiplier(damageProfile.default_target, armor.value))) * 4) / 4).toFixed(2);
		let armorCssClass = armor.name.split('(')[0].toLowerCase().trim(' ');
		
		let armorHeaderRow = `<div class="weaponDamageType grid ${armorCssClass}">
								<div class="damageType grid"><span class="center">${armor.name}</span></div>
								<div class="normalDamage damageCell grid"><span class="center">${armorClassNormalDamage}</span></div>
								<div class="headshotDamage damageCell grid"><span class="center">${armorClassHeadshotDamage}</span></div>
								<div class="critDamage damageCell grid"><span class="center">${armorClassCritDamage}</span></div>
								<div class="critHeadshotDamage damageCell grid"><span class="center">${armorClassCritHeadshotDamage}</span></div>
							</div>`;
		attackSwingDataTable.append(armorHeaderRow);
		
		for (let breed of getBreedsForArmorClass(armor)) {			
			let hitsToKillNormal = getHitsToKill(breed, armorClassNormalDamage);
			let hitsToKillCrit = getHitsToKill(breed, armorClassCritDamage);;
			let hitsToKillHeadshot = getHitsToKill(breed, armorClassHeadshotDamage);;
			let hitsToKillCritHeadshot = getHitsToKill(breed, armorClassCritHeadshotDamage);;
			
			let hitsToKillNormalHtml = `<span class="center">${hitsToKillNormal}</span>`;
			let hitsToKillCritHtml = `<span class="center">${hitsToKillCrit}</span>`;
			let hitsToKillHeadshotHtml = `<span class="center">${hitsToKillHeadshot}</span>`;
			let hitsToKillCritHeadshotHtml = `<span class="center">${hitsToKillCritHeadshot}</span>`;
			
			if (hitsToKillNormal < 7) {
				hitsToKillNormalHtml = "";
				for (let i = 0; i < hitsToKillNormal; i++) {
					hitsToKillNormalHtml += '<div class="filled"></div>';
				}
			}
			
			if (hitsToKillCrit < 7) {
				hitsToKillCritHtml = "";
				for (let i = 0; i < hitsToKillCrit; i++) {
					hitsToKillCritHtml += '<div class="filled"></div>';
				}
			}
			
			if (hitsToKillHeadshot < 7) {
				hitsToKillHeadshotHtml = "";
				for (let i = 0; i < hitsToKillHeadshot; i++) {
					hitsToKillHeadshotHtml += '<div class="filled"></div>';
				}
			}
			
			if (hitsToKillCritHeadshot < 7) {
				hitsToKillCritHeadshotHtml = "";
				for (let i = 0; i < hitsToKillCritHeadshot; i++) {
					hitsToKillCritHeadshotHtml += '<div class="filled"></div>';
				}
			}
			
			let breedNameCssClass = breed.name.split(" ").join('').toLowerCase();
			let breedRow = `<div class="weaponDamageEnemy grid ${breed.race.toLowerCase()} ${armorCssClass} ${breed.type.toLowerCase()} ${breedNameCssClass}">
							   <div class="enemyName grid"><span class="center">${breed.name}</span></div>
							   <div class="enemyRace grid"><i class="raceIcon"></i></div>
							   <div class="enemyHealth grid"><span class="center">${breed.legendHp}</span></div>
							   <div class="normalDamage damageCell grid">
								  <div class="enemyBreakpointBar flex center damageIndicator">
									 ${hitsToKillNormalHtml}
								  </div>
								  <div class="flex center cleaveIndicator">
									 <span class="center">8</span>
								  </div>
								  <div class="flex center staggerIndicator">
									 <span class="center">8</span>
								  </div>
							   </div>
							   <div class="critDamage damageCell grid">
								  <div class="enemyBreakpointBar flex center damageIndicator">
									 ${hitsToKillCritHtml}
								  </div>							  
								  <div class="flex center cleaveIndicator">
									 <span class="center">8</span>
								  </div>
								  <div class="flex center staggerIndicator">
									 <span class="center">8</span>
								  </div>
							   </div>
							   <div class="headshotDamage grid">
								  <div class="enemyBreakpointBar flex center damageIndicator">
									 ${hitsToKillHeadshotHtml}
								  </div>							  
								  <div class="flex center cleaveIndicator">
									 <span class="center">8</span>
								  </div>
								  <div class="flex center staggerIndicator">
									 <span class="center">8</span>
								  </div>
							   </div>
							   <div class="critHeadshotDamage grid">
								  <div class="enemyBreakpointBar flex center damageIndicator">
									 ${hitsToKillCritHeadshotHtml}
								  </div>							  
								  <div class="flex center cleaveIndicator">
									 <span class="center">8</span>
								  </div>
								  <div class="flex center staggerIndicator">
									 <span class="center">8</span>
								  </div>
							   </div>
							</div>`
			attackSwingDataTable.append(breedRow);
		}
		i++;
	}
}

function getHitsToKill(breed, damage, difficultyLevel) {
	if (damage == 0) {
		return "-";
	}		
	return Math.ceil(breed.legendHp / damage);
}

function getBreedsForArmorClass(armor) {
	if (!_breedData) {
		return;
	}
	return _breedData.filter((x) => { return x.armorCategory == armor.value && !x.name.startsWith('<') && x.type != "Critter"; })
}

function renderArmorClassEnemies(armor, attackTemplate) {
	let attackSwingDataTable = $(".weaponAttackDataTable .weaponAttackSwingTable:last-child .weaponDamageTable");
	let armorCssClass = armor.name.split('(')[0].toLowerCase().trim(' ');
	
	for (let breed of getBreedsForArmorClass(armor)) {
		let breedNameCssClass = breed.name.split(" ").join('').toLowerCase();
		let breedRow = `<div class="weaponDamageEnemy grid ${armorCssClass} ${breed.type.toLowerCase()} ${breedNameCssClass}">
						   <div class="enemyName grid ${breed.race.toLowerCase()}"><span class="center">${breed.name}</span></div>
						   <div class="enemyHealth grid"><span class="center">${breed.legendHp}</span></div>
						   <div class="normalDamage grid">
							  <div class="enemyBreakpointBar flex center damageIndicator">
								 <div class="filled"></div>
							  </div>
							  <div class="flex center cleaveIndicator">
								 <span class="center">8</span>
							  </div>
							  <div class="flex center staggerIndicator">
								 <span class="center">8</span>
							  </div>
						   </div>
						   <div class="critDamage grid">
							  <div class="enemyBreakpointBar flex center damageIndicator">
								 <div class="filled"></div>
							  </div>							  
							  <div class="flex center cleaveIndicator">
								 <span class="center">8</span>
							  </div>
							  <div class="flex center staggerIndicator">
								 <span class="center">8</span>
							  </div>
						   </div>
						   <div class="headshotDamage grid">
							  <div class="enemyBreakpointBar flex center damageIndicator">
								 <div class="filled"></div>
							  </div>							  
							  <div class="flex center cleaveIndicator">
								 <span class="center">8</span>
							  </div>
							  <div class="flex center staggerIndicator">
								 <span class="center">8</span>
							  </div>
						   </div>
						   <div class="critHeadshotDamage grid">
							  <div class="enemyBreakpointBar flex center damageIndicator">
								 <div class="filled"></div>
							  </div>							  
							  <div class="flex center cleaveIndicator">
								 <span class="center">8</span>
							  </div>
							  <div class="flex center staggerIndicator">
								 <span class="center">8</span>
							  </div>
						   </div>
						</div>`
		attackSwingDataTable.append(breedRow);
	}
}

function getModifiedBoostCurve(curve, modifier) {
	let modifiedCurve = [];
	for (let curveValue of curve) {
		modifiedCurve.push(curveValue * modifier);
	}
	return modifiedCurve;
}

function hasHeadshotBuff() {
	//TODO - Add Career headshot buff values
	return false;
}

function getHeadshotBoost(damageProfileTarget, armorCategory) {
	if (armorCategory == 3) {
		return 0.25;
	}	
	return 0.5;
}

function getMultiplier(damageProfileTarget, damageType, armorCategory) {
	let coefficient = !damageProfileTarget.boost_curve_coefficient_headshot ? DEFAULT_BOOST_CURVE_COEFFICIENT : damageProfileTarget.boost_curve_coefficient_headshot;
	let curve = getModifiedBoostCurve(damageProfileTarget.boost_curve, coefficient);
	let boost_amount = 0;
	switch(damageType) {
		case "crit":
			boost_amount = 0.5;
			break;
		case "headshot":
			boost_amount = getHeadshotBoost(damageProfileTarget, armorCategory);
			break;
		case "crit+headshot":
			boost_amount = 0.5 + getHeadshotBoost(damageProfileTarget, armorCategory);
			break;			
	}
	
	return getBoostCurveMultiplier(curve, Math.min(boost_amount, 1));
}

function getAdditionalCritMultiplier(damageProfileTarget, armorCategory) {
	return getMultiplier(damageProfileTarget, "crit", armorCategory);
	
}

function getAdditionalHeadshotMultiplier(damageProfileTarget, armorCategory) {
	return getMultiplier(damageProfileTarget, "headshot", armorCategory);
}

function getAdditionalCritHeadshotMultiplier(damageProfileTarget, armorCategory) {
	return getMultiplier(damageProfileTarget, "crit+headshot", armorCategory);
	
}

function getBoostCurveMultiplier(curve, percent) {
	let x = (curve.length - 1) * percent;
	let index = Math.floor(x) + 1;
	let t = x - Math.floor(x);
	let p0 = getClampedCurveValue(curve, index - 2);
	let p1 = getClampedCurveValue(curve, index - 1);
	let p2 = getClampedCurveValue(curve, index);
	let p3 = getClampedCurveValue(curve, index + 1);
	let a = (-p0 / 2 + (3 * p1) / 2) - (3 * p2) / 2 + p3 / 2;
	let b = (p0 - (5 * p1) / 2 + 2 * p2) - p3 / 2;
	let c = -p0 / 2 + p2 / 2;
	let d = p1;
	let value = a * t * t * t + b * t * t + c * t + d;

	return value;
}

function getClampedCurveValue(curve, index) {
	if (index < 0) {
		return curve[0];
	}
	else if (curve.length - 1 <= index) {
		return curve[curve.length - 1];
	}
	return curve[index];
}


function getScaledPowerLevel(powerLevel, difficultyLevel) {
	 return MAX_SCALED_POWER_LEVEL;
}

function renderAttackSwingIcons(attackGroup) {
}










$(document).ready(() => {
	if (window.location.hash.split('-').length == 2 || window.location.hash.length == 13) {		
		$(".mainGrid").addClass("locked");
		$(".buildDescription")[0].disabled = true;
	}
});