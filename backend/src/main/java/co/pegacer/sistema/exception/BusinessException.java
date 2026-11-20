package co.pegacer.sistema.exception;

import org.springframework.http.HttpStatus;

/** Error de negocio con un mensaje claro para el usuario (ej: "No hay suficiente cemento"). */
public class BusinessException extends RuntimeException {
    private final HttpStatus status;
    public BusinessException(String message) { this(message, HttpStatus.BAD_REQUEST); }
    public BusinessException(String message, HttpStatus status) { super(message); this.status = status; }
    public HttpStatus getStatus() { return status; }
}
