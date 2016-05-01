import omni_redis, sys, track_worker

print track_worker.get_original_release(omni_redis.get_track(sys.argv[1]))