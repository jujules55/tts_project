// pour une meilleur lisibillité on code certaines fonctions dans un fichier annexe
import { create_langs_select, update_voices } from "./annexe_function.js"

const myOwnKey = "a658a4899b2c41b787aa926843f0e9bb"; //Votre clé d'api ici!
const url = 'https://voicerss-text-to-speech.p.rapidapi.com/?key=' + myOwnKey; // l'url de l'API

window.addEventListener("DOMContentLoaded", () => { // on attend que le document soit charger avant d'executer le code js
    create_langs_select() // ajoute les langues dans le html (évite de le faire à la main)
    let select_langs = document.getElementById("langs"); // acquisition de la balise select des langues
    select_langs.addEventListener("input", update_voices); // mise à jour des voix choisissable en fonction de la langue choisis
    let canvas_onde = document.getElementById("onde"); // acquisition de la balise canvas pour dessinner la forme de l'onde
    let canvas_onde_context = canvas_onde.getContext("2d"); // acquisition du context du canvas pour pouvoir dessinner
    let canvas_freq = document.getElementById("freq"); // acquisition de la balise canvas pour le canvas pour dessinner la frequence
    let canvas_freq_context = canvas_freq.getContext("2d") // acquisition du context du canvas pour pouvoir dessinner
    let pitch_activation = document.getElementById("pitch_on"); // acquisition de la balise action du pitch
    let pitch_value = document.getElementById("pitch_value"); // acquisition de la balise de la valeur de la variation du pitch
    let select_voices = document.getElementById("voices"); // acquisition de la balise select pour les voix

    // initialisation des canvas
    canvas_onde_context.fillStyle = "rgb(0, 0, 0)";
    canvas_onde_context.fillRect(0, canvas_onde.clientHeight / 2 - 1, canvas_onde.clientWidth, 2);
    canvas_freq_context.fillStyle = "rgb(0,0,0)";
    canvas_freq_context.fillRect(0, 0, canvas_freq.clientWidth, canvas_freq.clientHeight);

    document.getElementById("start").addEventListener("click", () => { // préparation de la prononciation du texte à la demande du client
        const tts = document.getElementById("text").value; // récuperation du texte à prononcer
        let options = { // option nécessaire pour envoyer la requête à l'API
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'X-RapidAPI-Key': 'd8766a9c54msh346d5361a34f49bp120c7cjsn25c3b48040fe',
                'X-RapidAPI-Host': 'voicerss-text-to-speech.p.rapidapi.com'
            },
            body: new URLSearchParams({
                src: tts, // texte à prononcer
                hl: select_langs.value, // langue du texte
                v: select_voices.value, // voix a utiliser
                r: '0',
                c: 'mp3',
                f: '8khz_8bit_mono'
            })
        };

        let audioctx = new AudioContext(); // création du contexte audio pour gerer le son

        fetch(url, options) // requête vers l'API voiceRSS
            .then((data) => {
                return data.arrayBuffer() // récupération des donnée et stockage dans un buffer
            })
            .then(arrayBuffer => {
                return audioctx.decodeAudioData(arrayBuffer) // decodage des données en audio
            })
            .then(decodedAudio => {
                console.log(decodedAudio.duration) // log de la duré de l'audio
                return decodedAudio;
            })
            .then(audio => { // préparation de la lecture de l'audio
                return new Promise((resolve, reject) => {
                    const playSound = audioctx.createBufferSource(); //création d'un lecteur de fichier audio
                    let analyser_freq = audioctx.createAnalyser(); // création d'un analyseur pour visualiser les frequences du son 
                    let analyser_onde = audioctx.createAnalyser(); // création d'un analyseur pour visualiser la forme de l'onde 
                    analyser_freq.fftSize = 256;
                    analyser_onde.fftSize = 2048;
                    playSound.buffer = audio; // stockage de l'audio dans le lecteur 
                    if (pitch_activation.checked) { // si variation du pitch activer
                        playSound.detune.value = pitch_value.value; // on change la valeur de detune pour faire varier le pitch de l'audio
                        // https://developer.mozilla.org/fr/docs/Web/API/AudioBufferSourceNode/detune
                    }
                    playSound.connect(analyser_freq); // l'audio sort du lecteur pour aller dans l'analyseur pour la frequence
                    analyser_freq.connect(analyser_onde); // puis laudio sort de l'analyseur pour la frequence et vas dans l'analyseur pour la forme de l'onde
                    analyser_onde.connect(audioctx.destination); // enfin on connecte la sortie du deuxième analyseur à la sortie audio

                    let id_onde = requestAnimationFrame(function dessiner_onde() { // lancement de l'animation du canvas de visualisation de la forme de l'onde
                        id_onde = requestAnimationFrame(dessiner_onde); // on demande à appeller la fonction à la prochaine frame pour animer le canvas
                        let largeur = canvas_onde.clientWidth; // on récupère la largeur du canvas
                        let hauteur = canvas_onde.clientHeight; // on récupère la hauteur du canvas
                        let taille_tableau_donee = analyser_onde.frequencyBinCount;  // on récupère la taille du tableau de donnée à afficher
                        let tableau_donnees = new Uint8Array(taille_tableau_donee); // on créer un tableau de la bonne taille
                        analyser_onde.getByteTimeDomainData(tableau_donnees); // on récupère les données à afficher
                        canvas_onde_context.fillStyle = "rgb(200, 200, 200)";
                        canvas_onde_context.fillRect(0, 0, largeur, hauteur); // on clear le canvas 
                        canvas_onde_context.lineWidth = 2; // la ligne de la forme de l'onde sera dessinner avec 2 pixel d'épaisseur
                        canvas_onde_context.strokeStyle = "rgb(0, 0, 0)"; // en noir
                        canvas_onde_context.beginPath(); // on commence un nouveau chemin qui vas être la forme de l'onde
                        let largeur_segment = (largeur * 1.0) / taille_tableau_donee; // on calcul la largeur d'un segment pour que chaque donnee ai la même largeur de segment
                        let x = 0; // on comment à dessinner en x=0
                        for (let i = 0; i < taille_tableau_donee; i++) { // pour chaque donnee on vas faire un bout de segment
                            let v = tableau_donnees[i] / 128.0;
                            let y = (v * hauteur) / 2; // on calcul la hauteur du point 
                            if (i == 0) {
                                canvas_onde_context.moveTo(x, y); // au debut on place le curseur au premier point pour après faire une lingne de ce point au deuxème point
                            } else {
                                canvas_onde_context.lineTo(x, y); // on fait une ligne du dernier point fait au nouveau point calculer
                            }

                            x += largeur_segment; // on avance de la largeur d'un segment 
                        }
                        canvas_onde_context.lineTo(largeur, hauteur / 2); // on relie l'avant-dernier point au dernier point sur le bord du canvas
                        canvas_onde_context.stroke(); // on dessine le chemin définit audessus
                    });
                    let id_freq = requestAnimationFrame(function dessiner_freq() {// lancement de l'animation du canvas de visualisation des frequences
                        id_freq = requestAnimationFrame(dessiner_freq); // on demande à appeller la fonction à la prochaine frame pour animer le canvas
                        let largeur = canvas_freq.clientWidth; // on récupère la largeur du canvas
                        let hauteur = canvas_freq.clientHeight; // on récupère la hauteur du canvas
                        let taille_tableau_donee = analyser_freq.frequencyBinCount; // on récupère la taille du tableau de donnée à afficher
                        let tableau_donnees = new Uint8Array(taille_tableau_donee); // on créer un tableau de la bonne taille
                        analyser_freq.getByteFrequencyData(tableau_donnees) // on récupère les données à afficher
                        canvas_freq_context.fillStyle = 'rgb(0, 0, 0)';
                        canvas_freq_context.fillRect(0, 0, largeur, hauteur); // on clear le canvas
                        let largeur_barre = (largeur / taille_tableau_donee) * 2.5; // on calcul la largeur d'une barre pour que chaque frequence ai la même largeur de barre
                        // la voix humaine ayant des frequence plutot basse on multiplie par 2.5 pour visualiser essentiellement les basses fréquence
                        let x = 0; //on commence en x = 0
                        for (let i = 0; i < taille_tableau_donee; i++) { // pour chaque donnée on dessinne une barre de hauteur proportionnelle à la donnée
                            let hauteur_barre = (tableau_donnees[i]/255) * hauteur; // on divise la donnée par sa valeur maximale pour avoir un poucentage que l'on multiplie par la hauteur

                            canvas_freq_context.fillStyle = 'rgb(' + (hauteur_barre + 100) + ',50,50)'; // plus la barre est haute plus elle est rouge 
                            canvas_freq_context.fillRect(x, hauteur - hauteur_barre / 2, largeur_barre, hauteur_barre); // on dessine la barre correspondante
                            x += largeur_barre + 1; // on passe à la prochaine barre en laissant un espace pour distinguer chaque barre
                        }
                    })

                    playSound.start(); // on lance la lecture de l'audio

                    setTimeout(() => { 
                        playSound.stop(); // on stop le la lecture à la fin de l'audio
                        resolve();
                        // on arrête l'animation des canvas
                        window.cancelAnimationFrame(id_onde); 
                        window.cancelAnimationFrame(id_freq);
                    }, audio.duration * 1000);

                })
            })
    });

});
