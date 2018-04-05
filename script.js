'use strict';
var _data;
var _properties;
var career_select;
var talents_div;
var share_link;
var save_to_storage_button;
var save_to_storage_input;
var storage_list;
var storage_div;
var storage_btn;
var passives;
var skill;

function loadSerializedUrl() {
	let hash = window.location.hash.substring(1);
	var heroHashValue = hash.split('&').filter((item) => { return item.includes("hero"); })[0].replace("hero=","");
	var meleeHashValue = hash.split('&').filter((item) => { return item.includes("melee"); })[0].replace("melee=","");
	var rangeHashValue = hash.split('&').filter((item) => { return item.includes("range"); })[0].replace("range=","");
	var necklaceHashValue = hash.split('&').filter((item) => { return item.includes("necklace"); })[0].replace("necklace=","");
	var charmHashValue = hash.split('&').filter((item) => { return item.includes("charm"); })[0].replace("charm=","");
	var trinketHashValue = hash.split('&').filter((item) => { return item.includes("trinket"); })[0].replace("trinket=","");
	var talentsHashValue = hash.split('&').filter((item) => { return item.includes("talents"); })[0].replace("talents=","");
	
	let heroIndex = heroHashValue[0];
	let careerIndex = heroHashValue[1];
	
	$(".heroSection>div").removeClass('selected');
	$($(".heroSection").children()[heroIndex]).addClass('selected');
	$(".classSection>div").removeClass('selected');
	$($(".classSection").children()[careerIndex]).addClass('selected');
	
	loadHero(heroIndex, careerIndex);	
	loadMeleeWeapon(meleeHashValue);
	loadRangeWeapon(rangeHashValue);
	loadNecklace(necklaceHashValue);
	loadCharm(charmHashValue);
	loadTrinket(trinketHashValue);
	loadTalents(talentsHashValue);
	loadTraits();
	$(".footer>input")[0].value = getShareableUrl();
}

function loadAbilities(heroIndex, careerIndex) {
	$(".heroActiveAbility")[0].innerHTML = '';
	$(".heroPassiveAbility")[0].innerHTML = '';
	
	var skillName = _data.heroes[heroIndex].careers[careerIndex].skill.name;
	var skillDescription = _data.heroes[heroIndex].careers[careerIndex].skill.description;
	$(".heroActiveAbility").append(`<span>${skillName}</span><span>${skillDescription}</span>`);
	
	for (let ability of _data.heroes[heroIndex].careers[careerIndex].passives) {
		$(".heroPassiveAbility").append(`<span>${ability.name}</span><span>${ability.description}</span>`);
	}
}

function loadMeleeWeapon(serializedString) {
	let params = serializedString.split(';');
	let id = params[0].split(':')[1];
	let qualityId = params[1].split(':')[1];
	let power = params[2].split(':')[1];
	let property1Id = params[3].split(':')[1];
	let property1Value = params[4].split(':')[1];
	let property2Id = params[5].split(':')[1];
	let property2Value = params[6].split(':')[1];
	let traitId = params[7].split(':')[1];
	
	$(".meleeSelection")[0].selectedIndex = id;
	$(".meleeQualitySelection")[0].selectedIndex = qualityId;
	$(".meleeProperty1Selection")[0].selectedIndex = property1Id;
	$(".meleeProperty2Selection")[0].selectedIndex = property2Id;
	$(".meleeTraitSelection")[0].selectedIndex = traitId;
	$('input[name="meleePowerLevel"]')[0].value = power;
	$('input[name="meleeProperty1"]')[0].value = property1Value;
	$('input[name="meleeProperty2"]')[0].value = property2Value;
}

function loadRangeWeapon(serializedString) {
	let params = serializedString.split(';');
	let id = params[0].split(':')[1];
	let qualityId = params[1].split(':')[1];
	let power = params[2].split(':')[1];
	let property1Id = params[3].split(':')[1];
	let property1Value = params[4].split(':')[1];
	let property2Id = params[5].split(':')[1];
	let property2Value = params[6].split(':')[1];
	let traitId = params[7].split(':')[1];
	
	$(".rangeSelection")[0].selectedIndex = id;
	$(".rangeQualitySelection")[0].selectedIndex = qualityId;
	$(".rangeProperty1Selection")[0].selectedIndex = property1Id;
	$(".rangeProperty2Selection")[0].selectedIndex = property2Id;
	$(".rangeTraitSelection")[0].selectedIndex = traitId;
	$('input[name="rangePowerLevel"]')[0].value = power;
	$('input[name="rangeProperty1"]')[0].value = property1Value;
	$('input[name="rangeProperty2"]')[0].value = property2Value;
}

function loadNecklace(serializedString) {
	let params = serializedString.split(';');
	let qualityId = params[0].split(':')[1];
	let power = params[1].split(':')[1];
	let property1Id = params[2].split(':')[1];
	let property1Value = params[3].split(':')[1];
	let property2Id = params[4].split(':')[1];
	let property2Value = params[5].split(':')[1];
	let traitId = params[6].split(':')[1];
	
	$(".necklaceQualitySelection")[0].selectedIndex = qualityId;
	$(".necklaceProperty1Selection")[0].selectedIndex = property1Id;
	$(".necklaceProperty2Selection")[0].selectedIndex = property2Id;
	$(".necklaceTraitSelection")[0].selectedIndex = traitId;
	$('input[name="necklacePowerLevel"]')[0].value = power;
	$('input[name="necklaceProperty1"]')[0].value = property1Value;
	$('input[name="necklaceProperty2"]')[0].value = property2Value;
}

function loadCharm(serializedString) {
	let params = serializedString.split(';');
	let qualityId = params[0].split(':')[1];
	let power = params[1].split(':')[1];
	let property1Id = params[2].split(':')[1];
	let property1Value = params[3].split(':')[1];
	let property2Id = params[4].split(':')[1];
	let property2Value = params[5].split(':')[1];
	let traitId = params[6].split(':')[1];
	
	$(".charmQualitySelection")[0].selectedIndex = qualityId;
	$(".charmProperty1Selection")[0].selectedIndex = property1Id;
	$(".charmProperty2Selection")[0].selectedIndex = property2Id;
	$(".charmTraitSelection")[0].selectedIndex = traitId;
	$('input[name="charmPowerLevel"]')[0].value = power;
	$('input[name="charmProperty1"]')[0].value = property1Value;
	$('input[name="charmProperty2"]')[0].value = property2Value;
}

function loadTrinket(serializedString) {
	let params = serializedString.split(';');
	let qualityId = params[0].split(':')[1];
	let power = params[1].split(':')[1];
	let property1Id = params[2].split(':')[1];
	let property1Value = params[3].split(':')[1];
	let property2Id = params[4].split(':')[1];
	let property2Value = params[5].split(':')[1];
	let traitId = params[6].split(':')[1];
	
	$(".trinketQualitySelection")[0].selectedIndex = qualityId;
	$(".trinketProperty1Selection")[0].selectedIndex = property1Id;
	$(".trinketProperty2Selection")[0].selectedIndex = property2Id;
	$(".trinketTraitSelection")[0].selectedIndex = traitId;
	$('input[name="trinketPowerLevel"]')[0].value = power;
	$('input[name="trinketProperty1"]')[0].value = property1Value;
	$('input[name="trinketProperty2"]')[0].value = property2Value;
}

function loadTalents(serializedString) {
	$(".talentSection>div>div").removeClass('selected');
	
	for (var i = 0; i < 5; i++) {
		if (serializedString[i] > 2) {
			continue;
		}
		$($($(".talentSection>div")[i]).children()[serializedString[i]]).addClass('selected');
	}
}

function loadHero(heroIndex, careerIndex) {
	let career = _data.heroes[heroIndex].careers[careerIndex];
	let talents = career.talents;
	
	let i = 1;
	let y = 1;
	for (var tier of talents) {
			for (var talent of tier) {
				$(".talentSection>.tier" + i + ">.talent" + y)[0].innerHTML = '';
				$(".talentSection>.tier" + i + ">.talent" + y++).append('<span class="talentName">' +  talent.name + '</span><span class="talentDescription">' + talent.description + '</span>');
			}
			y = 1;
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
	for (var career of _data.heroes[heroIndex].careers) {
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
		
	for (var meleeWeapon of meleeWeapons) {
		$(".meleeSelection").append(new Option(meleeWeapon.name, i++));
	}
	loadMeleeProperties();
}

function loadMeleeProperties() {
	let property1Text = $(".meleeProperty1Selection")[0].options[$(".meleeProperty1Selection")[0].selectedIndex].text
	let property2Text = $(".meleeProperty2Selection")[0].options[$(".meleeProperty2Selection")[0].selectedIndex].text
	
	let property1 = _data.melee_properties.filter(function (item) { return item.name.includes(property1Text); })[0];
	let property2 = _data.melee_properties.filter(function (item) { return item.name.includes(property2Text); })[0];
	
	$('input[name="meleeProperty1"]').attr({ 
		"min": property1.min_value,
		"max": property1.max_value,
		"value": property1.max_value,
		"step": property1.step
	});
	
	$('input[name="meleeProperty2"]').attr({ 
		"min": property2.min_value,
		"max": property2.max_value,
		"value": property2.max_value,
		"step": property2.step
	});
	
	$('input[name="meleeProperty1"]').val(property1.max_value);
	$('input[name="meleeProperty2"]').val(property2.max_value);
}

function loadRangeWeapons(heroIndex, careerIndex) {
	$(".rangeSelection")[0].innerHTML = '';
	
	let heroCareer = _data.heroes[heroIndex].careers[careerIndex];		
	let rangeWeapons = _data.range_weapons.filter(function (item) { return item.class.includes(heroCareer.name); })
	let i = 0;
		
	for (var rangeWeapon of rangeWeapons) {
		$(".rangeSelection").append(new Option(rangeWeapon.name, i++));
	}
	loadRangeProperties();
	$(".rangeTraitSelection")[0].innerHTML = '';
	i = 0;
	for (var rangeTrait of _data.range_traits) {
		$(".rangeTraitSelection").append(new Option(rangeTrait.name, i++));
	}
}

function loadRangeProperties() {
	$(".rangeProperty1Selection")[0].innerHTML = '';
	$(".rangeProperty2Selection")[0].innerHTML = '';
	let i = 0;
	for (var rangeProperty of _data.range_properties) {
		$(".rangeProperty1Selection").append(new Option(rangeProperty.name, i));
		if (i == 1) {
			$(".rangeProperty2Selection").append(new Option(rangeProperty.name, i++, true, true));
		}
		else {
			$(".rangeProperty2Selection").append(new Option(rangeProperty.name, i++));
		}
	}
	
	let property1Text = $(".rangeProperty1Selection")[0].options[$(".rangeProperty1Selection")[0].selectedIndex].text
	let property2Text = $(".rangeProperty2Selection")[0].options[$(".rangeProperty2Selection")[0].selectedIndex].text
	
	let property1 = _data.range_properties.filter(function (item) { return item.name.includes(property1Text); })[0];
	let property2 = _data.range_properties.filter(function (item) { return item.name.includes(property2Text); })[0];
	
	$('input[name="rangeProperty1"]').attr({ 
		"min": property1.min_value,
		"max": property1.max_value,
		"value": property1.max_value,
		"step": property1.step
	});
	
	$('input[name="rangeProperty2"]').attr({ 
		"min": property2.min_value,
		"max": property2.max_value,
		"value": property2.max_value,
		"step": property2.step
	});
	
	$('input[name="rangeProperty1"]').val(property1.max_value);
	$('input[name="rangeProperty2"]').val(property2.max_value);
}

function loadSlayerRangeWeapons() {
	$(".rangeSelection")[0].innerHTML = '';
	
	let heroCareer = _data.heroes[1].careers[2];		
	let rangeWeapons = _data.melee_weapons.filter(function (item) { return item.class.includes(heroCareer.name); })
	let i = 0;
		
	for (var rangeWeapon of rangeWeapons) {
		$(".rangeSelection").append(new Option(rangeWeapon.name, i++));
	}
	loadSlayerRangeProperties();
	$(".rangeTraitSelection")[0].innerHTML = '';
	i = 0;
	for (var rangeTrait of _data.melee_traits) {
		$(".rangeTraitSelection").append(new Option(rangeTrait.name, i++));
	}
}

function loadSlayerRangeProperties() {
	$(".rangeProperty1Selection")[0].innerHTML = '';
	$(".rangeProperty2Selection")[0].innerHTML = '';
	let i = 0;
	for (var rangeProperty of _data.melee_properties) {
		$(".rangeProperty1Selection").append(new Option(rangeProperty.name, i));
		if (i == 1) {
			$(".rangeProperty2Selection").append(new Option(rangeProperty.name, i++, true, true));
		}
		else {
			$(".rangeProperty2Selection").append(new Option(rangeProperty.name, i++));
		}
	}
	
	let property1Text = $(".rangeProperty1Selection")[0].options[$(".rangeProperty1Selection")[0].selectedIndex].text
	let property2Text = $(".rangeProperty2Selection")[0].options[$(".rangeProperty2Selection")[0].selectedIndex].text
	
	let property1 = _data.melee_properties.filter(function (item) { return item.name.includes(property1Text); })[0];
	let property2 = _data.melee_properties.filter(function (item) { return item.name.includes(property2Text); })[0];
	
	$('input[name="rangeProperty1"]').attr({ 
		"min": property1.min_value,
		"max": property1.max_value,
		"value": property1.max_value,
		"step": property1.step
	});
	
	$('input[name="rangeProperty2"]').attr({ 
		"min": property2.min_value,
		"max": property2.max_value,
		"value": property2.max_value,
		"step": property2.step
	});
	
	$('input[name="rangeProperty1"]').val(property1.max_value);
	$('input[name="rangeProperty2"]').val(property2.max_value);
}

function loadNecklaceProperties() {
	let property1Text = $(".necklaceProperty1Selection")[0].options[$(".necklaceProperty1Selection")[0].selectedIndex].text
	let property2Text = $(".necklaceProperty2Selection")[0].options[$(".necklaceProperty2Selection")[0].selectedIndex].text
	
	let property1 = _data.necklace_properties.filter(function (item) { return item.name.includes(property1Text); })[0];
	let property2 = _data.necklace_properties.filter(function (item) { return item.name.includes(property2Text); })[0];
	
	$('input[name="necklaceProperty1"]').attr({ 
		"min": property1.min_value,
		"max": property1.max_value,
		"value": property1.max_value,
		"step": property1.step
	});
	
	$('input[name="necklaceProperty2"]').attr({ 
		"min": property2.min_value,
		"max": property2.max_value,
		"value": property2.max_value,
		"step": property2.step
	});
	
	$('input[name="necklaceProperty1"]').val(property1.max_value);
	$('input[name="necklaceProperty2"]').val(property2.max_value);
}

function loadCharmProperties() {
	let property1Text = $(".charmProperty1Selection")[0].options[$(".charmProperty1Selection")[0].selectedIndex].text
	let property2Text = $(".charmProperty2Selection")[0].options[$(".charmProperty2Selection")[0].selectedIndex].text
	
	let property1 = _data.charm_properties.filter(function (item) { return item.name.includes(property1Text); })[0];
	let property2 = _data.charm_properties.filter(function (item) { return item.name.includes(property2Text); })[0];
	
	$('input[name="charmProperty1"]').attr({ 
		"min": property1.min_value,
		"max": property1.max_value,
		"value": property1.max_value,
		"step": property1.step
	});
	
	$('input[name="charmProperty2"]').attr({ 
		"min": property2.min_value,
		"max": property2.max_value,
		"value": property2.max_value,
		"step": property2.step
	});
	
	$('input[name="charmProperty1"]').val(property1.max_value);
	$('input[name="charmProperty2"]').val(property2.max_value);
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
	
	if (getHeroIndex() == 1 && getCareerIndex() == 2) {		
		let rangeTrait = $(".rangeTraitSelection")[0].options[$(".rangeTraitSelection")[0].selectedIndex].value
		$(".rangeWeaponSection>.traitDescription")[0].innerHTML = "<span>" + _data.melee_traits[rangeTrait].description + "</span>";
	}
	else {
		let rangeTrait = $(".rangeTraitSelection")[0].options[$(".rangeTraitSelection")[0].selectedIndex].value
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
	return 'http://verminbuilds.com/#' + getSerializedUrl();
}

function getHeroIndex() {
	return Array.prototype.indexOf.call($(".heroSection").children(),$(".heroSection>div.selected")[0]);
}
function getCareerIndex() {
	return Array.prototype.indexOf.call($(".classSection").children(),$(".classSection>div.selected")[0]);
}

function initData() {
	let i = 0;
	/*
	for (var meleeWeapon of _data.melee_weapons) {
		$(".meleeSelection").append(new Option(meleeWeapon.name, i++));
	}
	
	i = 0;
	for (var rangeWeapon of _data.range_weapons) {
		$(".rangeSelection").append(new Option(rangeWeapon.name, i++));
	*/
	
	i = 0;
	for (var meleeTrait of _data.melee_traits) {
		$(".meleeTraitSelection").append(new Option(meleeTrait.name, i++));
	}
	
	i = 0;
	for (var rangeTrait of _data.range_traits) {
		$(".rangeTraitSelection").append(new Option(rangeTrait.name, i++));
	}
	
	i = 0;
	for (var meleeProperty of _data.melee_properties) {
		$(".meleeProperty1Selection").append(new Option(meleeProperty.name, i));
		if (i == 1) {
			$(".meleeProperty2Selection").append(new Option(meleeProperty.name, i++, true, true));
		}
		else {
			$(".meleeProperty2Selection").append(new Option(meleeProperty.name, i++));
		}
	}
	
	i = 0;
	for (var rangeProperty of _data.range_properties) {
		$(".rangeProperty1Selection").append(new Option(rangeProperty.name, i));
		if (i == 1) {
			$(".rangeProperty2Selection").append(new Option(rangeProperty.name, i++, true, true));
		}
		else {
			$(".rangeProperty2Selection").append(new Option(rangeProperty.name, i++));
		}
	}
	
	i = 0;
	for (var necklaceTrait of _data.necklace_traits) {
		$(".necklaceTraitSelection").append(new Option(necklaceTrait.name, i++));
	}
	
	i = 0;
	for (var charmTrait of _data.charm_traits) {
		$(".charmTraitSelection").append(new Option(charmTrait.name, i++));
	}
	
	i = 0;
	for (var trinketTrait of _data.trinket_traits) {
		$(".trinketTraitSelection").append(new Option(trinketTrait.name, i++));
	}
	
	i = 0;
	for (var necklaceProperty of _data.necklace_properties) {
		$(".necklaceProperty1Selection").append(new Option(necklaceProperty.name, i));
		if (i == 1) {
		$(".necklaceProperty2Selection").append(new Option(necklaceProperty.name, i++, true, true));
		}
		else {
		$(".necklaceProperty2Selection").append(new Option(necklaceProperty.name, i++));
		}
	}
	
	i = 0;
	for (var charmProperty of _data.charm_properties) {
		$(".charmProperty1Selection").append(new Option(charmProperty.name, i));
		if (i == 1) {
		$(".charmProperty2Selection").append(new Option(charmProperty.name, i++));
		}
		else {
		$(".charmProperty2Selection").append(new Option(charmProperty.name, i++, true, true));
		}
	}
	
	i = 0;
	for (var trinketProperty of _data.trinket_properties) {
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
	loadNecklaceProperties();
	loadCharmProperties();
	loadTrinketProperties();
	loadTraits();
	
	if (window.location.hash) {
		loadSerializedUrl();
	}
}

$(function() {
	career_select = $('#career-select');
	talents_div = $('#talents-div');	
	share_link = $('#share-link');
	save_to_storage_button = $('#save-to-storage-button');
	save_to_storage_input = $('#save-to-storage-input');
	storage_list = $('#storage-list');
	storage_div = $('#storage-div');
	storage_btn = $('#storage-btn');
	passives = $('#passives');
	skill = $('#skill');
	
	
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
		$(".footer>input")[0].value = getShareableUrl();
	});
	
	$(".heroSection>div").click((e) => { 
        $(e.currentTarget.parentElement).children().removeClass('selected'); 
        $(".classSection").children().removeClass('selected'); 
        $(e.currentTarget).addClass('selected'); 
        $($(".classSection").children()[0]).addClass('selected'); 
        let index = Array.prototype.indexOf.call($(e.currentTarget.parentElement).children(),e.currentTarget);
        loadHero(index, 0);
		$(".footer>input")[0].value = getShareableUrl();
		$(".talentSection>div>div").removeClass("selected")
    });
	
	$(".classSection>div").click((e) => { 
        $(e.currentTarget.parentElement).children().removeClass('selected'); 
        $(e.currentTarget).addClass('selected'); 
        let index = Array.prototype.indexOf.call($(e.currentTarget.parentElement).children(),e.currentTarget);
        let heroIndex = Array.prototype.indexOf.call($(".heroSection").children(),$(".heroSection>div.selected")[0]);
		loadHero(heroIndex, index);
		$(".footer>input")[0].value = getShareableUrl();
		$(".talentSection>div>div").removeClass("selected")
    });
	
	$(".meleeSelection").change((e) => { 
		$(".footer>input")[0].value = getShareableUrl();
    });		
	
	$(".rangeSelection").change((e) => { 
		$(".footer>input")[0].value = getShareableUrl();
    });		
	
	$(".traitSelection").change((e) => { 
        loadTraits();
		$(".footer>input")[0].value = getShareableUrl();
    });
	
	$('input[type="number"]').change((e) => { 
		$(".footer>input")[0].value = getShareableUrl();
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
		$(".footer>input")[0].value = getShareableUrl();
	});
});