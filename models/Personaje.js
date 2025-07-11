class Personaje {
    constructor(id, nombre, ciudad, tipo, equipo) {
        this.id = id;
        this.nombre = nombre;
        this.ciudad = ciudad;
        this.tipo = tipo; // 'superheroe' o 'villano'
        this.vida = 100;
        if (equipo) this.equipo = equipo;
    }

    golpeBasico(objetivo) {
        objetivo.vida -= 5;
    }

    golpeEspecial(objetivo) {
        objetivo.vida -= 30;
    }

    golpeCritico(objetivo) {
        objetivo.vida -= 45;
    }
}

class Heroe extends Personaje {
    constructor(id, nombre, ciudad) {
        super(id, nombre, ciudad, 'superheroe');
    }
}

class Villano extends Personaje {
    constructor(id, nombre, ciudad) {
        super(id, nombre, ciudad, 'villano');
    }
}

export { Personaje, Heroe, Villano }; 