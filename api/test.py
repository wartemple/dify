from transformers import GPT2Tokenizer
tok = GPT2Tokenizer.from_pretrained("gpt2")
tok.save_pretrained("gpt2")