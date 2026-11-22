package com.monitorenergia.web;

import com.monitorenergia.servicio.ConflictoException;
import com.monitorenergia.servicio.DatosInvalidosException;
import com.monitorenergia.servicio.DemasiadosIntentosException;
import com.monitorenergia.servicio.NoAutorizadoException;
import com.monitorenergia.servicio.NoEncontradoException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ManejadorErrores {

    @ExceptionHandler(NoEncontradoException.class)
    public ProblemDetail noEncontrado(NoEncontradoException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(ConflictoException.class)
    public ProblemDetail conflicto(ConflictoException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, e.getMessage());
    }

    @ExceptionHandler(NoAutorizadoException.class)
    public ProblemDetail noAutorizado(NoAutorizadoException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, e.getMessage());
    }

    @ExceptionHandler(DatosInvalidosException.class)
    public ProblemDetail datosInvalidos(DatosInvalidosException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(DemasiadosIntentosException.class)
    public ProblemDetail demasiadosIntentos(DemasiadosIntentosException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.TOO_MANY_REQUESTS, e.getMessage());
    }
}
