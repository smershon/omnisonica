def batch_as_stream(input_stream, process_func, batch_size=100):
    buffer = []
    for item in input_stream:
        buffer.append(item)
        if len(buffer) >= batch_size:
            for processed_item in process_func(buffer):
                yield processed_item
            buffer = []
    if buffer:
        for processed_item in process_func(buffer):
            yield processed_item
            
def clean_title(title):
    cleaned_title = []
    for i,token in enumerate(title.split(' ')):
        if (token.startswith('-') 
                or (token.startswith('(') and i >= 1)
                or (token.startswith('[') and i >= 1)):
            break
        cleaned_title.append(token)
    return ' '.join(cleaned_title)