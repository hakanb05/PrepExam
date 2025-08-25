// Script om alle vragen automatisch op "E" te beantwoorden
// Dit is voor testdoeleinden

// Voeg dit toe aan de quiz pagina om automatisch alle vragen op "E" te beantwoorden
function autoAnswerAllQuestions() {
    // Zoek alle radio buttons met waarde "E"
    const radioButtons = document.querySelectorAll('input[type="radio"]')

    radioButtons.forEach(radio => {
        if (radio.value && radio.value.endsWith('E')) {
            radio.checked = true
            // Trigger change event
            radio.dispatchEvent(new Event('change', { bubbles: true }))
        }
    })

    console.log('Alle vragen automatisch beantwoord met optie E')
}

// Voeg een knop toe aan de pagina
function addAutoAnswerButton() {
    const button = document.createElement('button')
    button.textContent = 'Auto-Answer All with E'
    button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    padding: 10px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  `

    button.onclick = autoAnswerAllQuestions

    document.body.appendChild(button)
}

// Voeg de knop toe wanneer de pagina laadt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addAutoAnswerButton)
} else {
    addAutoAnswerButton()
}

// Automatisch uitvoeren na 2 seconden
setTimeout(autoAnswerAllQuestions, 2000)
