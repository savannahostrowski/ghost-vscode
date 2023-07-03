const fs = require("fs")
function getFilesInCurrentDirAndSubDirs()  {
	var files:string[]
    fs.readdir(".", (err: Error, files ) => {
		files.foreach(file => {
			files.append(file)
		})
	console.log(files);
	})
	// err := filepath.Walk(".", func(path string, info os.FileInfo, err error) error {
	// 	if path[0] == '.' {
	// 		return nil
	// 	}

	// 	if !info.IsDir() {
	// 		files = append(files, path)
	// 	}
	// 	return nil
	// })
	// if err != nil {
	// 	fmt.Println(err)
	// 	os.Exit(1)P
	// }
	// return files
}