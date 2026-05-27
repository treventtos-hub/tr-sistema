package com.tr.backend.service;

import org.springframework.stereotype.Service;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class SenhaService {

    private static final int ITERACOES = 120000;
    private static final int TAMANHO_CHAVE = 256;
    private static final SecureRandom RANDOM = new SecureRandom();

    public String gerarHash(String senha) {
        try {
            byte[] salt = new byte[16];
            RANDOM.nextBytes(salt);
            byte[] hash = calcularHash(senha.toCharArray(), salt);
            return Base64.getEncoder().encodeToString(salt) + ":" + Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new IllegalStateException("Nao foi possivel gerar hash da senha.", e);
        }
    }

    public boolean validar(String senha, String senhaHash) {
        try {
            String[] partes = senhaHash.split(":");
            if (partes.length != 2) return false;
            byte[] salt = Base64.getDecoder().decode(partes[0]);
            byte[] hashEsperado = Base64.getDecoder().decode(partes[1]);
            byte[] hashRecebido = calcularHash(senha.toCharArray(), salt);
            if (hashRecebido.length != hashEsperado.length) return false;
            int diff = 0;
            for (int i = 0; i < hashRecebido.length; i++) {
                diff |= hashRecebido[i] ^ hashEsperado[i];
            }
            return diff == 0;
        } catch (Exception e) {
            return false;
        }
    }

    private byte[] calcularHash(char[] senha, byte[] salt) throws Exception {
        PBEKeySpec spec = new PBEKeySpec(senha, salt, ITERACOES, TAMANHO_CHAVE);
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        return factory.generateSecret(spec).getEncoded();
    }
}
