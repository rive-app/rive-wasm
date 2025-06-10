i=$(cat number)

echo "i: $i"

j=$((i+=1))

echo "j: $j"
echo "$j" > number