/**
 * Extension A4_Lampadaire - Blocs MakeCode micro:bit
 */
//% block="A4_Lampadaire" color=#4DA3FF icon="\uf0eb" weight=45
namespace A4_Lampadaire {

    const NB_LED = 10
    const PIN_NEOPIXEL = DigitalPin.P1

    let ruban: neopixel.Strip = null
    let puissancePct = 100

    function getRuban(): neopixel.Strip {
        if (!ruban) {
            ruban = neopixel.create(PIN_NEOPIXEL, NB_LED, NeoPixelMode.RGB)
            ruban.clear()
            ruban.show()
            ruban.setBrightness(Math.idiv(puissancePct * 255, 100))
        }
        return ruban
    }
export enum CouleurAllumage {
    //% block="Blanc"
    Blanc = 1,
    //% block="Bleu"
    Bleu = 2,
    //% block="Vert"
    Vert = 3,
    //% block="Magenta"
    Magenta = 4
}
    
    let seuilJourNuitPct = 50
    let seuilJourNuitLL = 127

    //% block="Seuil jour/nuit $seuil"
    //% seuil.min=0 seuil.max=100 seuil.defl=50
    export function seuilJourNuit(seuil: number): void {
        if (seuil < 0) seuil = 0
        else if (seuil > 100) seuil = 100

        seuilJourNuitPct = seuil
        seuilJourNuitLL = Math.idiv(seuil * 255, 100)
    }

    //% block="Lire lumière (0 à 100)"
    export function lireLumiere0a100(): number {
        return Math.idiv(input.lightLevel() * 100, 255)
    }

    //% block="Jour"
    export function jour(): boolean {
        return input.lightLevel() > seuilJourNuitLL
    }

    //% block="Nuit"
    export function nuit(): boolean {
        return input.lightLevel() <= seuilJourNuitLL
    }

    //% block="Allumer Lampadaire"
    export function allumerLampadaire(): void {
        pins.digitalWritePin(DigitalPin.P0, 1)
        basic.showNumber(1)
    }

    //% block="Eteindre Lampadaire"
    export function eteindreLampadaire(): void {
        pins.digitalWritePin(DigitalPin.P0, 0)
        basic.showNumber(0)
    }

    export enum ModeEclairage {
        //% block="Eteindre"
        Eteindre = 0,
        //% block="Blanc"
        Blanc = 1,
        //% block="Bleu"
        Bleu = 2,
        //% block="Vert"
        Vert = 3,
        //% block="Magenta"
        Magenta = 4
    }

    /**
     * Puissance éclairage (0..100)
     */
    //% block="Puissance éclairage (0 à 100) $niveau"
    //% niveau.min=0 niveau.max=100 niveau.defl=100
    export function puissanceEclairage(niveau: number): void {
        if (niveau < 0) niveau = 0
        else if (niveau > 100) niveau = 100

        puissancePct = niveau

        if (ruban) {
            ruban.setBrightness(Math.idiv(puissancePct * 255, 100))
            ruban.show()
        }
    }

    //% block="Eclairage $mode"
    //% mode.defl=ModeEclairage.Eteindre
    export function eclairage(mode: ModeEclairage): void {
        const s = getRuban()
        s.setBrightness(Math.idiv(puissancePct * 255, 100))

        switch (mode) {
            case ModeEclairage.Eteindre:
                s.clear()
                s.show()
                break
            case ModeEclairage.Blanc:
                s.showColor(NeoPixelColors.White)
                break
            case ModeEclairage.Bleu:
                s.showColor(NeoPixelColors.Blue)
                break
            case ModeEclairage.Vert:
                s.showColor(NeoPixelColors.Green)
                break
            case ModeEclairage.Magenta:
                s.showColor(neopixel.rgb(255, 0, 255))
                break
        }
    }
}
/**
 * Allumage progressif (couleur) de 0 à (x) % en (t) s
 */
//% block="Allumage progressif ($couleur) de 0 à $puissance % en $temps s"
//% inlineInputMode=inline
//% puissance.min=0 puissance.max=100 puissance.defl=100
//% temps.min=0 temps.max=60 temps.defl=5
//% advanced=true
export function allumageProgressif(couleur: CouleurAllumage, puissance: number, temps: number): void {
    // bornage
    if (puissance < 0) puissance = 0
    else if (puissance > 100) puissance = 100
    if (temps < 0) temps = 0
    else if (temps > 60) temps = 60

    const s = getRuban()

    // Choix couleur -> RGB
    let c = NeoPixelColors.White
    switch (couleur) {
        case CouleurAllumage.Blanc:   c = NeoPixelColors.White; break
        case CouleurAllumage.Bleu:    c = NeoPixelColors.Blue; break
        case CouleurAllumage.Vert:    c = NeoPixelColors.Green; break
        case CouleurAllumage.Magenta: c = neopixel.rgb(255, 0, 255); break
    }

    const cible255 = Math.idiv(puissance * 255, 100)

    // Démarrage à 0 (éteint) + couleur déjà chargée dans le ruban
    s.setBrightness(0)
    s.showColor(c) // affichage "off" car brightness=0

    // Si temps = 0, on applique directement
    if (temps == 0) {
        puissancePct = puissance          // mémorise la puissance choisie
        s.setBrightness(cible255)
        s.show()
        return
    }

    const dureeMs = temps * 1000
    // ~10 mises à jour / seconde (pas trop lourd, assez fluide)
    let steps = Math.idiv(dureeMs, 100)
    if (steps < 1) steps = 1
    const pauseMs = Math.idiv(dureeMs, steps)

    for (let i = 0; i <= steps; i++) {
        const b = Math.idiv(cible255 * i, steps)
        s.setBrightness(b)
        s.show()
        if (i < steps) basic.pause(pauseMs)
    }

    // mémorise la puissance finale pour les autres blocs
    puissancePct = puissance
}
