

out = array([0.,0.,0.,0.])

def toColour(v):
    return max(min(1.0,v),0.0)

v = 0.534534

out[0] = (v * 2**0)
out[1] = (v * 2**8)
out[2] = (v * 2**16)
out[3] = (v * 2**24)

out %= 1

def encode(v):
    v = float32(v)
    out = [0.,0.,0.]
    out[0] = (v/(2**16))
    out[1] = abs(( (v/2**16) * 2**16) - v)/2**8
    out[2] = abs(((v/2**8) * 2**8) - v)/2**0
    return out

def decode(out):
    return int(out[2]) + int(out[1]) * 2**8 + int(out[0]) * 2**16


def encode2(v):
    byte1 = floor(v/65536.);
    byte2 = floor((v - (byte1 * 65536.))/256.);
    byte3 = floor((v - floor(v/256.) * 256.));
    return [byte1, byte2, byte3]
