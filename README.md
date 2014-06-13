hashr
=====

CS 241 (Systems Programming) Honors Project. Hashr is a web application that is used to distribute brute force cracking of MD5 hashes (can only crack strings made up of alphanumeric characters). A client may input a MD5 hash, which is added to a list of jobs on the server. Using round-robin scheduling, the server distributes chunks of each job to available clients.
