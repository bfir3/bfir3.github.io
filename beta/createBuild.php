<?php
	
	//$data = $_POST['guid'] . '_' . $_POST['name'] . '_' . $_POST['serializedString'] . "\n";
	$data = $_POST['builds'];
	
	
    $ret = file_put_contents('v2builds.json', $data, LOCK_EX);
    if($ret === false) {
        die('There was an error writing this file');
    }
    else {
        echo "Build saved!";
    }
?>