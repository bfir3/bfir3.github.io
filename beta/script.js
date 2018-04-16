'use strict';
let _data;
let _properties;
let buildId;
let db;
let builds;
let buildSetId;
let currentUser;

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
	$(".loadoutSelection")[0].options[$(".loadoutSelection")[0].selectedIndex].text = buildName;
}

function loadLoadouts() {
	if ($(".loadoutSelection")[0].options.length > 0) {
		return;
	}
	db.collection("buildTable").where("buildSetId", "==", getBuildSetId()).get().then((queryRef) => {
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
	if ($(".loadoutSelection")[0].options.length > 0) {
		return $(".loadoutSelection")[0].options[$(".loadoutSelection")[0].selectedIndex].value;
	}
	
	buildId = getUniqueIdentifier();
	window.location.hash = getBuildSetId() + '-' + buildId;
	
	let buildName = !$(".buildName").val() || $(".buildName").val().length == 0 ? "Untitled Build" : $(".buildName").val();	
	
	$(".loadoutSelection").append(new Option(buildName, buildId));
	return buildId;
}

function getBuildSetId() {	
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
	
	let authorEmail = getCurrentUser() ? getCurrentUser().email : "";
	
	docRef.set({
		buildSetId:clonedBuildSetId,
		author: authorEmail,
		name: buildName,
		description: buildDescription,
		hash: getSerializedUrl(),
		videoLink: $(".relatedVideo").val()
	}, { merge: true }).then(function (ref) {
		console.log("build cloned successfully");
		window.location.hash = `${clonedBuildSetId}-${clonedBuildId}`;
		$(".mainGrid").removeClass('locked');
	});
}

function updateBuild() {	
	if ($(".mainGrid").hasClass('locked')) {
		return;
	}
	let buildName = $(".buildName").val();	
	let buildDescription = $(".buildDescription").val();	
	
	let docRef = db.collection("buildTable").doc(getBuildId());
	
	let authorEmail = getCurrentUser() ? getCurrentUser().email : "";
	
	docRef.set({
		buildSetId:getBuildSetId(),
		author: authorEmail,
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
		db.collection("buildTable").doc(buildId).get().then((doc) => {
			let views = doc.data().pageViews ? doc.data().pageViews++ : 1;
				
			doc.set({
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
		$(".footer>input").val(getShareableUrl());
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
	$($(".heroSection").children()[heroIndex]).addClass('selected');
	$(".classSection>div").removeClass('selected');
	$($(".classSection").children()[careerIndex]).addClass('selected');
	
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
		
	/*
	loadProperties("melee", _data.melee_properties);	
	heroIndex == 1 && careerIndex == 2 ? loadProperties("range", _data.melee_properties) : loadProperties("range", _data.range_properties);	
	loadProperties("necklace", _data.necklace_properties);
	loadProperties("charm", _data.charm_properties);
	loadProperties("trinket", _data.trinket_properties);	
	*/
}

function loadHeroSummary() {
	let heroIndex = getHeroIndex();
	let careerIndex = getCareerIndex();
	$(".heroClass1").css('background',  `url('images/icons/heroes/${heroIndex}/0/icon.png')`);
	$(".heroClass2").css('background',  `url('images/icons/heroes/${heroIndex}/1/icon.png')`);
	$(".heroClass3").css('background',  `url('images/icons/heroes/${heroIndex}/2/icon.png')`);
	
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
		$($($(".talentSection>div")[i]).children()[serializedString[i]]).addClass('selected');
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
		}
		else {
			heroCareers[i].classList.remove("selected");
		}
		
		heroCareers[i].innerHTML = '';
		heroCareers[i++].innerHTML = '<span>' + career.name + '</span>';
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
	
	loadHero(0,0);
	loadHeroSummary(0, 0);
		
	loadProperties("melee", _data.melee_properties);	
	getHeroIndex() == 1 && getCareerIndex() == 2 ? loadProperties("range", _data.melee_properties) : loadProperties("range", _data.range_properties);	
	loadProperties("necklace", _data.necklace_properties);
	loadProperties("charm", _data.charm_properties);
	loadProperties("trinket", _data.trinket_properties);	
	
	loadTraits();
	
	if (window.location.hash) {
		loadBuild();
	}
	
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
		currentUser = user;
	  } else {
		// No user is signed in.
	  }
	});
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
		}
	});
	
	$(".mainGrid:not(.locked) .talentSection>div>div").click((e) => { 
		$(e.currentTarget.parentElement).children().removeClass('selected'); 
		$(e.currentTarget).addClass('selected'); 
		//$(".footer>input")[0].value = getShareableUrl();
		updateBuild();
	});
	
	$(".mainGrid:not(.locked) .heroSection>div").click((e) => { 
        $(e.currentTarget.parentElement).children().removeClass('selected'); 
        $(".classSection").children().removeClass('selected'); 
        $(e.currentTarget).addClass('selected'); 
        $($(".classSection").children()[0]).addClass('selected'); 
        let index = Array.prototype.indexOf.call($(e.currentTarget.parentElement).children(),e.currentTarget);
        loadHero(index, 0);
		//$(".footer>input")[0].value = getShareableUrl();
		updateBuild();
		$(".talentSection>div>div").removeClass("selected")
		
		loadHeroSummary();
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
	});
	
	
	$(".cloneBuildButton").click((e) => {
		cloneBuild();
	});
});

function getCurrentUser() {
	return firebase.auth().currentUser;
}

$(document).ready(() => {
	if (window.location.hash.split('-').length == 2 || window.location.hash.length == 13) {		
		$(".mainGrid").addClass("locked");
	}
});