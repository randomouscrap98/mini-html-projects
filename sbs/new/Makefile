index.html: index.convert index.config index_template.html
	echo "---" | cat index.config - index_template.html | index.convert > index.html

index.convert: index.c
	gcc index.c -o index.convert
	# cat index.config | awk -F` '{ print "s`%$1%`$2`g" }' > index.sed

.PHONY: clean
clean:
	rm index.html
	rm index.convert
