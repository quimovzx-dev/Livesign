# LiveSign V5

A browser-based gesture sentence builder.

## Permanent training
Training examples are saved immediately in IndexedDB. Reloading/closing the same Vercel site in the same Android browser will restore them automatically.

## Backup
Use **Export Training** after training. This creates `livesign-training-backup.json`. If browser/site data is ever cleared, use **Import Training**.

## Sentence gestures
- Letters append letters.
- SPACE adds a space.
- COMMA adds `, `.
- PERIOD adds `. `.
- Accept Sign adds the current detected token.

Example:
`H E L L O COMMA SPACE W O R L D PERIOD`

becomes:

`HELLO, WORLD. `

## Deployment
Upload `index.html`, `style.css`, and `app.js` to GitHub and deploy to Vercel.

## Note
J and Z are motion-based ASL letters and need temporal recognition rather than a single static frame.