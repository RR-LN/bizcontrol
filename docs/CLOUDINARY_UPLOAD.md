# BizControl 360 - Upload de Imagens com Cloudinary

## 📸 API de Upload de Imagens

### Endpoint
```
POST /api/upload-image
DELETE /api/upload-image
```

### Autenticação
Apenas usuários com roles **ADMIN** ou **MANAGER** podem fazer upload de imagens.

---

## 🔧 Configuração do Cloudinary

### 1. Criar Conta Gratuita
Acesse: https://cloudinary.com/users/register_free

### 2. Obter Credenciais
Após criar a conta, vá para o Dashboard e copie:
- **Cloud Name**
- **API Key**
- **API Secret**

### 3. Adicionar ao `.env`
```env
CLOUDINARY_CLOUD_NAME="sua_cloud_name"
CLOUDINARY_API_KEY="sua_api_key"
CLOUDINARY_API_SECRET="seu_api_secret"
```

---

## 📤 Como Usar a API

### Upload de Imagem

**Request:**
```javascript
const formData = new FormData()
formData.append('file', imageFile)

const response = await fetch('/api/upload-image', {
  method: 'POST',
  body: formData,
})

const data = await response.json()
```

**Response (Success):**
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/bizcontrol360/abc123.jpg",
  "publicId": "bizcontrol360/abc123",
  "message": "Imagem enviada com sucesso"
}
```

**Response (Error):**
```json
{
  "error": "Acesso negado. Apenas Admin e Manager podem fazer upload de imagens."
}
```

---

### Deletar Imagem

**Request:**
```javascript
const response = await fetch('/api/upload-image', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    publicId: 'bizcontrol360/abc123'
  }),
})
```

---

## ✅ Validações

### Tipos Permitidos
- ✅ JPEG (`image/jpeg`)
- ✅ JPG (`image/jpg`)
- ✅ PNG (`image/png`)
- ✅ WebP (`image/webp`)

### Tamanho Máximo
- **5MB** por arquivo

### Otimizações Automáticas
- 🖼️ Redimensionamento: máximo 1000x1000px
- 🎨 Qualidade automática
- 📦 Formato automático (WebP quando possível)

---

## 🔒 Controle de Acesso

| Role     | Upload | Delete |
|----------|--------|--------|
| ADMIN    | ✅     | ✅     |
| MANAGER  | ✅     | ✅     |
| OPERATOR | ❌     | ❌     |
| VIEWER   | ❌     | ❌     |

---

## 💡 Exemplo de Componente React

```tsx
"use client"

import { useState } from "react"

export default function ImageUploader() {
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState("")

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setImageUrl(data.url)
        alert('Imagem enviada com sucesso!')
      } else {
        alert(data.error)
      }
    } catch (error) {
      alert('Erro ao enviar imagem')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Enviando...</p>}
      {imageUrl && <img src={imageUrl} alt="Uploaded" />}
    </div>
  )
}
```

---

## 📊 Limites do Free Tier (Cloudinary)

- ✅ 25 créditos/mês (equivale a ~25GB de armazenamento)
- ✅ 25GB de transferência/mês
- ✅ 25.000 transformações/mês
- ✅ Sem limite de uploads

**Perfeito para produção de pequeno/médio porte!**

---

## 🚀 Próximos Passos

1. Criar conta no Cloudinary
2. Copiar credenciais para `.env`
3. Reiniciar servidor Next.js
4. Testar upload via Postman ou componente React

---

## 📝 Código da API

Localização: `src/app/api/upload-image/route.ts`

Features implementadas:
- ✅ Upload com validation
- ✅ Delete de imagens
- ✅ Otimização automática
- ✅ Proteção por role
- ✅ Tratamento de erros
