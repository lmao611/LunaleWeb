import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        min: 0,
        required: true,
    },
    image: { 
        type: String,
        required: [true, 'Image required'],
    },
    thumbnails: [
        {
            type: String,
        }
    ],
    category: {
        type: String,
        required: true,
    },
    productLink: {              // 👈 thêm dòng này
        type: String,
        required: false,
    },
    isFeatured: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

export default Product;
