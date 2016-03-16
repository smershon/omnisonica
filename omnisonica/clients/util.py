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