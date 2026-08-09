# LiveSign V2

Mobile-first ASL alphabet recognition website.

## GitHub/Vercel

Upload `index.html`, `style.css`, `app.js`, and the `model/` folder to GitHub.
Deploy the repository to Vercel as a static site.

## Model requirement

`app.js` expects:

`model/model.json`

The model must accept 63 normalized landmark values (21 x/y/z landmarks) and return 26 outputs in this order:

A B C D E F G H I J K L M N O P Q R S T U V W X Y Z

A TensorFlow.js Layers model can be loaded directly from `model/model.json`.

### Important

Do not put a random or incompatible model into the folder. The model must be trained on the same landmark feature format.

J and Z require motion/temporal recognition and should be added with a sequence model in the next model revision; a static frame classifier cannot reliably distinguish them.

This project recognizes ASL fingerspelling, not full ASL grammar.
