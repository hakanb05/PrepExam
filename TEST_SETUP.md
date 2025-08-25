# Test Setup Instructies

## Wat is er toegevoegd:

### 1. NBME21.json
- Nieuwe test exam met 4 secties
- 2 vragen per sectie (totaal 8 vragen)
- Verschillende onderwerpen: Basic Sciences, Clinical Medicine, Pharmacology, Emergency Medicine

### 2. Database Updates
- Seed.ts bijgewerkt om beide exams (nbme20a en nbme21) te verwerken
- User `hakanbektas934@gmail.com` krijgt automatisch access tot beide exams
- Alle purchases zijn 1 jaar geldig

### 3. Test Attempt Script
- `scripts/create-test-attempt.js` - Maakt een voltooide attempt aan met alle antwoorden als "E"
- Uitvoeren met: `node scripts/create-test-attempt.js`

### 4. Auto-Answer Functionaliteit
- Quiz pagina heeft nu een gele knop "🧪 Auto-Answer All with E"
- Klik op deze knop om alle vragen automatisch op optie E te beantwoorden
- Handig voor snelle testen zonder handmatig klikken

## Hoe te gebruiken:

### Stap 1: Database bijwerken
```bash
# Start de database (als Docker beschikbaar is)
docker-compose up -d

# Of gebruik de bestaande database
# Voer de seed uit
npx prisma db seed
```

### Stap 2: Test attempt aanmaken (optioneel)
```bash
node scripts/create-test-attempt.js
```

### Stap 3: Testen in de applicatie
1. Ga naar `/exam/nbme20a/section/s1`
2. Klik op de gele knop "🧪 Auto-Answer All with E"
3. Alle vragen worden automatisch beantwoord met optie E
4. Klik op "Submit Section" om door te gaan

### Stap 4: Review bekijken
1. Ga naar `/exam/nbme20a/review`
2. Bekijk hoe alle vragen eruit zien met de nieuwe afbeeldingen structuur
3. Controleer de question statistics

## Belangrijke wijzigingen in nbme20a.json:

- **s1q2**: Alle afbeeldingen verplaatst naar `explanationImage`
- **s1q23**: Alleen `patient.png` blijft in `image`, `normal.png` naar `explanationImage`
- **s1q45**: ECG afbeelding verplaatst naar `explanationImage`
- **s3q2**: Thoracic duct afbeelding verplaatst naar `explanationImage`
- **s3q13**: Bone afbeelding verplaatst naar `explanationImage`
- **s3q17**: Alleen `left_right.png` blijft in `image`, `example2.png` naar `explanationImage`

## Test Doelen:

1. **Afbeeldingen structuur**: Controleer of `image` en `explanationImage` correct worden weergegeven
2. **Question statistics**: Bekijk of de percentages correct worden berekend
3. **Review functionaliteit**: Test de navigatie en weergave van alle vragen
4. **Auto-answer**: Test de nieuwe test functionaliteit

## Troubleshooting:

- Als de database niet start, controleer of Docker draait
- Als de seed faalt, controleer of alle JSON bestanden correct zijn
- Voor vragen over de test functionaliteit, bekijk de console logs
