while :
do
	result = lt --subdomain home-toki-stresser --port 3000
	if [[$result == "your url is: https://home-toki-stresser.loca.lt"]]; then
		echo OK
	else
		PID=$!
		kill $PID
	fi
done
	echo Something wrong