import { langs_codes, voices } from "./param.js"

function removeAllChildNodes(parent) { 
    // supprime tous les enfants d'un noeuds
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

export function update_voices() {
    // mets à jour les voix choisissable en fonction de la langue choisis
    let select_langs = document.getElementById("langs"); // on recupère la balise de selection des langues
    let select_voices = document.getElementById("voices"); // on récupère la balise de selection des voix
    removeAllChildNodes(select_voices); // on enlève toutes les voix déjà présentent dans la selection des voix 
    // on ajoute l'option par defaut qui donne l'instruction au client de ce qu'il faut faire
    let opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "-- choisissez une voix --";
    select_voices.appendChild(opt);
    voices[select_langs.value].forEach((voice) => { // pour chaque voix possible our la langue choisis
        // on créer une balise option dans la selection des voix
        let opt = document.createElement("option");
        opt.value = voice.split(' ')[0];
        opt.textContent = voice;
        select_voices.appendChild(opt);
    });
}

export function create_langs_select() { // créeer les options de selection des langues
    let select_langs = document.getElementById("langs");
    Object.keys(langs_codes).forEach((key) => {
        let opt = document.createElement("option");
        opt.value = langs_codes[key];
        opt.textContent = key;
        select_langs.appendChild(opt);
    })
}