/**
 * A4 Lampadaire
 */
///% weight=100 color=#0B1F3B icon="\uf0eb" block="A4_Lampadaire"
namespace A4_Lampadaire {

    /**
     * Allumer le lampadaire (P0 à 1)
     */
    //% block="Allumer Lampadaire"
    export function allumerLampadaire(): void {
        pins.digitalWritePin(DigitalPin.P0, 1)
    }

    /**
     * Éteindre le lampadaire (P0 à 0)
     */
    //% block="EteindreLampadaire"
    export function eteindreLampadaire(): void {
        pins.digitalWritePin(DigitalPin.P0, 0)
    }
}