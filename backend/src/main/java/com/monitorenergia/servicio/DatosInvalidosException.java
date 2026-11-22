package com.monitorenergia.servicio;

public class DatosInvalidosException extends RuntimeException {
    public DatosInvalidosException(String mensaje) { super(mensaje); }
}
