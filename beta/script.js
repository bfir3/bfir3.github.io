'use strict';
let _data;
let _properties;
let buildId;
let db;

function getUniqueIdentifier() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16).split('-')[4];
  });
}

function getBuildId() {
	if (!buildId || buildId.length == 0) {
		buildId = getUniqueIdentifier();
		window.location.hash = buildId;
		$(".footer>input").val('http://verminbuilds.com/#' + buildId);
	}
	return buildId;
}

function updatePageViews() {
	// Update view counter for current build based on cookie data/ip address
}

function updateBuild() {	
	let buildName = $(".buildName").val();	
	let buildDescription = $(".buildDescription").val();	
	
	let docRef = db.collection("buildSets").doc(getBuildId());
	
	docRef.set({
		buildSetName: "",
		buildSetDescription:""		
	});
	
	docRef.collection("builds").doc(getUniqueIdentifier()).set({
		name: buildName,
		description: buildDescription,
		hash: getSerializedUrl(),
		videoLink: ""
	}).then(function (ref) {
		// successfully added data
	});
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
		
	db.collection("buildSets").doc(hash).collection("builds").get().then((queryRef) => {
		queryRef.forEach((doc) => {
			$(".buildName").val(doc.data().name);
			$(".buildDescription").val(doc.data().description);
			loadSerializedUrl(doc.data().hash);
		});
	});
}

function loadCareerBuild(buildSetId, buildId) {
	// return build from db based on ids
}

function getHashValue(hash, keyString) {
	hash.split('&').filter((item) => { return item.includes(keyString); })[0].replace(`${keyString}=`,"")
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
	loadSerializedGear("melee", meleeHashValue);
	loadSerializedGear("range", rangeHashValue);
	loadSerializedGear("necklace", necklaceHashValue);
	loadSerializedGear("charm", charmHashValue);
	loadSerializedGear("trinket", trinketHashValue);
	loadTalents(talentsHashValue);
	loadTraits();
		
	loadProperties("melee", _data.melee_properties);	
	heroIndex == 1 && careerIndex == 2 ? loadProperties("range", _data.melee_properties) : loadProperties("range", _data.range_properties);	
	loadProperties("necklace", _data.necklace_properties);
	loadProperties("charm", _data.charm_properties);
	loadProperties("trinket", _data.trinket_properties);	
	loadHeroSummary();
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

function loadSerializedGear(gearName, serializedString) {
	let params = serializedString.split(';');
	let id = params[0].split(':')[1];
	let qualityId = params[1].split(':')[1];
	let power = params[2].split(':')[1];
	let property1Id = params[3].split(':')[1];
	let property1Value = params[4].split(':')[1];
	let property2Id = params[5].split(':')[1];
	let property2Value = params[6].split(':')[1];
	let traitId = params[7].split(':')[1];
	
	$(`.${gearName}Selection`)[0].selectedIndex = id;
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
		if(careerIndex == i && !heroCareers[i].classList.contains("selected")) {
			heroCareers[i].classList.value += " selected";
		}
		else {
			heroCareers[i].classList.value.replace(" selected","");
		}
		
		heroCareers[i].innerHTML = '';
		heroCareers[i++].innerHTML = '<span>' + career.name + '</span>';
	}
	loadMeleeWeapons(heroIndex,careerIndex);
	if (heroIndex == 1 && careerIndex == 2) {
		loadSlayerRangeWeapons();
		return;
	}
	
	loadRangeWeapons(heroIndex,careerIndex);
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
	let rangeWeapons = _data.range_weapons.filter(function (item) { return item.class.includes(heroCareer.name); })
	let i = 0;
		
	for (let rangeWeapon of rangeWeapons) {
		$(".rangeSelection").append(new Option(rangeWeapon.name, i++));
	}
	heroIndex == 1 && careerIndex == 2 ? loadSlayerRangeProperties() : loadRangeProperties();
}


function loadTrinketProperties() {
	let property1Text = $(".trinketProperty1Selection")[0].options[$(".trinketProperty1Selection")[0].selectedIndex].text
	let property2Text = $(".trinketProperty2Selection")[0].options[$(".trinketProperty2Selection")[0].selectedIndex].text
	
	let property1 = _data.trinket_properties.filter(function (item) { return item.name.includes(property1Text); })[0];
	let property2 = _data.trinket_properties.filter(function (item) { return item.name.includes(property2Text); })[0];
	
	$('input[name="trinketProperty1"]').attr({ 
		"min": property1.min_value,
		"max": property1.max_value,
		"value": property1.max_value,
		"step": property1.step
	});
	
	$('input[name="trinketProperty2"]').attr({ 
		"min": property2.min_value,
		"max": property2.max_value,
		"value": property2.max_value,
		"step": property2.step
	});
	
	$('input[name="trinketProperty1"]').val(property1.max_value);
	$('input[name="trinketProperty2"]').val(property2.max_value);
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
	heroIndex == 1 && careerIndex == 2 ? loadProperties("range", _data.melee_properties) : loadProperties("range", _data.range_properties);	
	loadProperties("necklace", _data.necklace_properties);
	loadProperties("charm", _data.charm_properties);
	loadProperties("trinket", _data.trinket_properties);	
	
	loadTraits();
	
	if (window.location.hash) {
		loadBuild();
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
	
	$(".talentSection>div>div").click((e) => { 
		$(e.currentTarget.parentElement).children().removeClass('selected'); 
		$(e.currentTarget).addClass('selected'); 
		//$(".footer>input")[0].value = getShareableUrl();
		updateBuild();
	});
	
	$(".heroSection>div").click((e) => { 
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
	
	$(".classSection>div").click((e) => { 
        $(e.currentTarget.parentElement).children().removeClass('selected'); 
        $(e.currentTarget).addClass('selected'); 
        let index = Array.prototype.indexOf.call($(e.currentTarget.parentElement).children(),e.currentTarget);
        let heroIndex = Array.prototype.indexOf.call($(".heroSection").children(),$(".heroSection>div.selected")[0]);
		loadHero(heroIndex, index);
		updateBuild();
		$(".talentSection>div>div").removeClass("selected")
		loadHeroSummary();
    });
	
	$(".meleeSelection").change((e) => { 
		updateBuild();
    });		
	
	$(".rangeSelection").change((e) => { 
		updateBuild();
    });		
	
	$(".traitSelection").change((e) => { 
        loadTraits();
		updateBuild();
    });
	
	$('input[type="number"]').change((e) => { 
		updateBuild();
    });
	
	
	$('input[type="text"]').change((e) => { 
		updateBuild();
    });
	
	$('textarea').change((e) => { 
		updateBuild();
    });
	
	$('input.relatedVideo').change((e) => { 
		let videoAddress = e.currentTarget.val();
		if (videoAddress.indexof("twitch.tv") >= 0) {

		} else if (videoAddress.indexOf("") >= 0) {
			
		}
    });
	
	$(".propertySelection").change((e) => { 
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
});