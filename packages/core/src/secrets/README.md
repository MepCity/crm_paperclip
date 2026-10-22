# SecretBox (Envelope Encryption)

ADR 0009 Topic 2 implementation for encrypting credentials and secrets at rest.

## Environment Variables

- `SECRET_BOX_KEYS`: Comma-separated list of `keyId:base64Key` entries. Each key must be a 32-byte AES key encoded as standard base64 (e.g. `k1:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=`).
- `SECRET_BOX_ACTIVE_KEY_ID`: The identifier of the key to use when sealing new secrets. Must exist in `SECRET_BOX_KEYS`.

## Security Guarantees

1. **Defensive copying:** `createAesGcmSecretBox` creates internal copies of the provided key `Map` and each key `Buffer`. Subsequent mutations by the caller to the map or key buffers do not affect the secret box.
2. **Error safety:** Decryption and verification errors raise a uniform `SecretBoxError` that never carries plaintext, ciphertext, or key bytes. Configuration and parsing errors never echo key material.
3. **Key rotation:** Sealed records embed the key identifier (`v1.<keyId>.<iv>.<ct>.<tag>`). The `rewrap` method can decrypt using old keys still in the ring and re-seal using the active key id without exposing secrets.
